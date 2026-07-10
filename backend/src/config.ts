function parseJwtHours(rawValue: string | undefined): number {
  if (!rawValue) {
    return 8;
  }

  const normalized = rawValue.trim().toLowerCase();
  const asHours = normalized.endsWith("h") ? normalized.slice(0, -1) : normalized;
  const parsed = Number(asHours);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 8;
  }

  return parsed;
}

const corsOrigin = process.env.CORS_ORIGIN ?? "*";
const databaseUrl = process.env.DATABASE_URL ?? "postgresql://serp:serp@localhost:5432/serp";
const isProduction = process.env.NODE_ENV === "production" || corsOrigin !== "*";

const databaseSsl =
  process.env.DATABASE_SSL === "true" ||
  process.env.PGSSLMODE === "require" ||
  databaseUrl.includes("sslmode=require");

export const config = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl,
  jwtSecret: process.env.JWT_SECRET ?? "serp-dev-secret",
  jwtExpiresInHours: parseJwtHours(process.env.JWT_EXPIRES_IN_HOURS ?? process.env.JWT_EXPIRES_IN),
  corsOrigin,
  isProduction,
  cookieSameSite: (isProduction ? "None" : "Lax") as "None" | "Lax" | "Strict",
  cookieSecure: isProduction,
  databaseSsl
};

if (config.isProduction) {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === "serp-dev-secret") {
    throw new Error(
      "Insecure production configuration: JWT_SECRET must be set to a strong value (not the dev default)."
    );
  }
  if (!process.env.CORS_ORIGIN || process.env.CORS_ORIGIN === "*") {
    throw new Error(
      "Insecure production configuration: CORS_ORIGIN must be set to a specific origin (not '*')."
    );
  }
}
