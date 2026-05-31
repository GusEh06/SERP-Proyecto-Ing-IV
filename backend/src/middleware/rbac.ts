import type { Context, Next } from "hono";
import type { UserRole } from "../types";
import type { AuthContextUser } from "./auth";

export function requireRoles(roles: UserRole[]) {
  return async (c: Context, next: Next) => {
    const user = c.get("user") as AuthContextUser | undefined;

    if (!user) {
      return c.json({ message: "Unauthorized" }, 401);
    }

    if (!roles.includes(user.role)) {
      return c.json({ message: "Forbidden" }, 403);
    }

    await next();
  };
}
