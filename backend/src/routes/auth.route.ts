import { Hono } from "hono";
import { z } from "zod";
import { setCookie, deleteCookie, getCookie } from "hono/cookie";
import { sql } from "../db/client";
import { createToken } from "../lib/jwt";
import { writeAuditLog } from "../services/audit.service";
import bcrypt from "bcrypt";
import { config } from "../config";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const loginAttempts = new Map<string, RateLimitEntry>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 5 * 60 * 1000;

function getClientIp(c: { req: { header: (name: string) => string | undefined } }): string {
  const forwarded = c.req.header("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return c.req.header("x-real-ip") ?? "unknown";
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);

  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (entry.count >= MAX_ATTEMPTS) {
    return false;
  }

  entry.count++;
  return true;
}

export const authRoute = new Hono();

authRoute.post("/login", async (c) => {
  const ip = getClientIp(c);
  const body = await c.req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ message: "Bad request" }, 400);
  }

  if (!checkRateLimit(ip)) {
    await writeAuditLog({
      usuarioId: 0,
      rol: "sistema",
      accion: "POST /auth/login",
      recursoTipo: "usuario",
      resultado: "fallo",
      ipAddress: ip
    });
    return c.json({ message: "Too many attempts. Try again later." }, 429);
  }

  const [user] = await sql<{
    id: number;
    nombre: string;
    email: string;
    password_hash: string;
    rol: "proveedor" | "analista" | "oficial_cumplimiento" | "administrador";
  }[]>`
    SELECT id, nombre, email, password_hash, rol
    FROM usuario
    WHERE email = ${parsed.data.email}
    LIMIT 1
  `;

  if (!user) {
    await writeAuditLog({
      usuarioId: 0,
      rol: "sistema",
      accion: "POST /auth/login",
      recursoTipo: "usuario",
      resultado: "fallo",
      ipAddress: ip
    });
    return c.json({ message: "Invalid credentials" }, 401);
  }

  const passwordValid = await bcrypt.compare(parsed.data.password, user.password_hash);

  if (!passwordValid) {
    await writeAuditLog({
      usuarioId: user.id,
      rol: user.rol,
      accion: "POST /auth/login",
      recursoTipo: "usuario",
      recursoId: user.id,
      resultado: "fallo",
      ipAddress: ip
    });
    return c.json({ message: "Invalid credentials" }, 401);
  }

  const token = await createToken({
    id: user.id,
    email: user.email,
    role: user.rol,
    name: user.nombre
  });

  await writeAuditLog({
    usuarioId: user.id,
    rol: user.rol,
    accion: "POST /auth/login",
    recursoTipo: "usuario",
    recursoId: user.id,
    resultado: "exito",
    ipAddress: ip
  });

  setCookie(c, "serp_token", token, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: config.cookieSameSite,
    path: "/",
    maxAge: config.jwtExpiresInHours * 60 * 60
  });

  return c.json({
    user: {
      id: user.id,
      name: user.nombre,
      email: user.email,
      role: user.rol
    }
  });
});

authRoute.post("/logout", (c) => {
  deleteCookie(c, "serp_token", {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: config.cookieSameSite,
    path: "/"
  });
  return c.json({ message: "Logged out" });
});

authRoute.get("/me", async (c) => {
  const token = getCookie(c, "serp_token");
  if (!token) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  try {
    const { verify } = await import("hono/jwt");
    const payload = await verify(token, config.jwtSecret, "HS256");
    return c.json({
      user: {
        id: Number(payload.sub),
        email: String(payload.email),
        role: String(payload.role),
        name: String(payload.name)
      }
    });
  } catch {
    return c.json({ message: "Unauthorized" }, 401);
  }
});
