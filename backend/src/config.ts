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

export const config = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: process.env.DATABASE_URL ?? "postgresql://serp:serp@localhost:5432/serp",
  jwtSecret: process.env.JWT_SECRET ?? "serp-dev-secret",
  jwtExpiresInHours: parseJwtHours(process.env.JWT_EXPIRES_IN_HOURS ?? process.env.JWT_EXPIRES_IN),
  corsOrigin: process.env.CORS_ORIGIN ?? "*"
};
