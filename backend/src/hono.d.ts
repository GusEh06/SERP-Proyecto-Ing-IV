import type { AuthContextUser } from "./middleware/auth";

declare module "hono" {
  interface ContextVariableMap {
    user: AuthContextUser;
  }
}
