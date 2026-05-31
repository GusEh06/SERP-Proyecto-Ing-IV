export const config = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: process.env.DATABASE_URL ?? "postgresql://serp:serp@localhost:5432/serp",
  jwtSecret: process.env.JWT_SECRET ?? "serp-dev-secret",
  jwtExpiresInHours: 8
};
