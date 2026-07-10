import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import { Hono } from "hono";
import bcrypt from "bcrypt";

const TEST_USER = {
  nombre: "Analista Cookie",
  email: "cookie-analista@serp.local",
  password: "analista123",
  rol: "analista"
};

async function loadDeps() {
  vi.resetModules();
  const { sql } = await import("../db/client");
  const { runMigrations } = await import("../db/migrate");
  const { authRoute } = await import("../routes/auth.route");
  return { sql, runMigrations, authRoute };
}

describe("auth cookies - local mode", () => {
  let app: Hono;
  let sql: Awaited<ReturnType<typeof loadDeps>>["sql"];
  let runMigrations: Awaited<ReturnType<typeof loadDeps>>["runMigrations"];

  beforeAll(async () => {
    vi.unstubAllEnvs();
    const deps = await loadDeps();
    sql = deps.sql;
    runMigrations = deps.runMigrations;
    await runMigrations();

    app = new Hono();
    app.route("/auth", deps.authRoute);

    const hash = await bcrypt.hash(TEST_USER.password, 10);
    await sql`
      INSERT INTO usuario (nombre, email, password_hash, rol)
      VALUES (${TEST_USER.nombre}, ${TEST_USER.email}, ${hash}, ${TEST_USER.rol})
      ON CONFLICT (email) DO NOTHING
    `;
  });

  afterEach(async () => {
    await sql`DELETE FROM auditoria_log WHERE usuario_id = (SELECT id FROM usuario WHERE email = ${TEST_USER.email})`;
    await sql`DELETE FROM usuario WHERE email = ${TEST_USER.email}`;
  });

  afterAll(async () => {
    await sql.end();
  });

  it("login sets SameSite=Lax cookie in local mode", async () => {
    const res = await app.request("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: TEST_USER.email, password: TEST_USER.password })
    });

    expect(res.status).toBe(200);

    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toBeDefined();
    expect(setCookie).toContain("serp_token=");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=Lax");
    expect(setCookie).not.toContain("Secure");
  });
});

describe("auth cookies - production mode", () => {
  let app: Hono;
  let sql: Awaited<ReturnType<typeof loadDeps>>["sql"];
  let runMigrations: Awaited<ReturnType<typeof loadDeps>>["runMigrations"];

  beforeAll(async () => {
    vi.unstubAllEnvs();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CORS_ORIGIN", "https://frontend.example.com");
    vi.stubEnv("JWT_SECRET", "strong-prod-secret");

    const deps = await loadDeps();
    sql = deps.sql;
    runMigrations = deps.runMigrations;
    await runMigrations();

    app = new Hono();
    app.route("/auth", deps.authRoute);

    const hash = await bcrypt.hash(TEST_USER.password, 10);
    await sql`
      INSERT INTO usuario (nombre, email, password_hash, rol)
      VALUES (${TEST_USER.nombre}, ${TEST_USER.email}, ${hash}, ${TEST_USER.rol})
      ON CONFLICT (email) DO NOTHING
    `;
  });

  afterEach(async () => {
    await sql`DELETE FROM auditoria_log WHERE usuario_id = (SELECT id FROM usuario WHERE email = ${TEST_USER.email})`;
    await sql`DELETE FROM usuario WHERE email = ${TEST_USER.email}`;
  });

  afterAll(async () => {
    await sql.end();
    vi.unstubAllEnvs();
  });

  it("login sets SameSite=None and Secure cookie in production mode", async () => {
    const res = await app.request("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: TEST_USER.email, password: TEST_USER.password })
    });

    expect(res.status).toBe(200);

    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toBeDefined();
    expect(setCookie).toContain("serp_token=");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=None");
    expect(setCookie).toContain("Secure");
  });
});
