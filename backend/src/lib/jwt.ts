import { sign } from "hono/jwt";
import { config } from "../config";
import type { AuthUser } from "../types";

export async function createToken(user: AuthUser): Promise<string> {
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const expInSeconds = nowInSeconds + config.jwtExpiresInHours * 60 * 60;

  return sign(
    {
      sub: String(user.id),
      email: user.email,
      role: user.role,
      name: user.name,
      iat: nowInSeconds,
      exp: expInSeconds
    },
    config.jwtSecret
  );
}
