import { Hono } from "hono";
import { z } from "zod";
import { sql } from "../db/client";
import { createToken } from "../lib/jwt";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const authRoute = new Hono();

authRoute.post("/login", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ message: "Bad request", issues: parsed.error.issues }, 400);
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

  if (!user || user.password_hash !== parsed.data.password) {
    return c.json({ message: "Invalid credentials" }, 401);
  }

  const token = await createToken({
    id: user.id,
    email: user.email,
    role: user.rol,
    name: user.nombre
  });

  return c.json({
    token,
    user: {
      id: user.id,
      name: user.nombre,
      email: user.email,
      role: user.rol
    }
  });
});
