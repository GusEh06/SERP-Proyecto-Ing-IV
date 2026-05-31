import type { Context, Next } from "hono";
import { verify } from "hono/jwt";
import { config } from "../config";
import type { UserRole } from "../types";

export interface AuthContextUser {
  id: number;
  email: string;
  role: UserRole;
  name: string;
}

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header("authorization") ?? "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  try {
    const payload = await verify(token, config.jwtSecret, "HS256");
    const user: AuthContextUser = {
      id: Number(payload.sub),
      email: String(payload.email),
      role: payload.role as UserRole,
      name: String(payload.name)
    };
    c.set("user", user);
    await next();
  } catch {
    return c.json({ message: "Unauthorized" }, 401);
  }
}
