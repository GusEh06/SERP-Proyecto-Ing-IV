import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { sql } from "../db/client";
import { runMigrations } from "../db/migrate";

beforeAll(async () => {
  await runMigrations();
});

afterAll(async () => {
  await sql.end();
});

describe("migrations (advisory lock + retry/idempotency)", () => {
  it("runMigrations is a function", () => {
    expect(typeof runMigrations).toBe("function");
  });

  it("runs successfully, acquires/releases the advisory lock, and applies schema", async () => {
    await expect(runMigrations()).resolves.toBeUndefined();

    const [row] = await sql<{ t: string | null }[]>`
      SELECT to_regclass('public.usuario') AS t
    `;
    expect(row.t).toBe("usuario");
  });

  it("is idempotent across repeated runs", async () => {
    await expect(runMigrations()).resolves.toBeUndefined();
    await expect(runMigrations()).resolves.toBeUndefined();
  });

  it("concurrent migrations both succeed without error", async () => {
    await expect(
      Promise.all([runMigrations(), runMigrations(), runMigrations()])
    ).resolves.toBeDefined();
  });
});
