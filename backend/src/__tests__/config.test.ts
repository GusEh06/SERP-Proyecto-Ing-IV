import { describe, it, expect, afterEach, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("config cookie/ssl/fail-fast logic", () => {
  it("local/default: isProduction false, cookieSameSite Lax, cookieSecure false", async () => {
    vi.resetModules();
    vi.unstubAllEnvs();
    const { config } = await import("../config");
    expect(config.isProduction).toBe(false);
    expect(config.cookieSameSite).toBe("Lax");
    expect(config.cookieSecure).toBe(false);
  });

  it("production with strong secret + specific origin: isProduction true, SameSite None, Secure true", async () => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CORS_ORIGIN", "https://frontend.example.com");
    vi.stubEnv("JWT_SECRET", "strong-prod-secret");
    const { config } = await import("../config");
    expect(config.isProduction).toBe(true);
    expect(config.cookieSameSite).toBe("None");
    expect(config.cookieSecure).toBe(true);
  });

  it("databaseSsl true via DATABASE_SSL=true", async () => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.stubEnv("DATABASE_SSL", "true");
    const { config } = await import("../config");
    expect(config.databaseSsl).toBe(true);
  });

  it("databaseSsl true via PGSSLMODE=require", async () => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.stubEnv("PGSSLMODE", "require");
    const { config } = await import("../config");
    expect(config.databaseSsl).toBe(true);
  });

  it("databaseSsl true when DATABASE_URL contains sslmode=require", async () => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.stubEnv(
      "DATABASE_URL",
      "postgresql://serp:serp@localhost:5432/serp?sslmode=require"
    );
    const { config } = await import("../config");
    expect(config.databaseSsl).toBe(true);
  });

  it("databaseSsl false by default", async () => {
    vi.resetModules();
    vi.unstubAllEnvs();
    const { config } = await import("../config");
    expect(config.databaseSsl).toBe(false);
  });

  it("throws in production when JWT_SECRET is the dev default", async () => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CORS_ORIGIN", "https://x.com");
    vi.stubEnv("JWT_SECRET", "serp-dev-secret");
    await expect(import("../config")).rejects.toThrow();
  });

  it("throws in production when CORS_ORIGIN is '*'", async () => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CORS_ORIGIN", "*");
    vi.stubEnv("JWT_SECRET", "strong-prod-secret");
    await expect(import("../config")).rejects.toThrow();
  });

  it("throws in production when CORS_ORIGIN is unset", async () => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("JWT_SECRET", "strong-prod-secret");
    await expect(import("../config")).rejects.toThrow();
  });

  it("throws in production when JWT_SECRET is unset", async () => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CORS_ORIGIN", "https://x.com");
    vi.stubEnv("JWT_SECRET", "");
    await expect(import("../config")).rejects.toThrow();
  });
});
