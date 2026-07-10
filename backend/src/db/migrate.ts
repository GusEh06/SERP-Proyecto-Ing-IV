import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { sql } from "./client";

const MAX_MIGRATION_ATTEMPTS = 10;
const MIGRATION_RETRY_DELAY_MS = 2000;
const MIGRATION_ADVISORY_LOCK_ID = 912837465;

async function applySchema() {
  const schemaPath = resolve(process.cwd(), "src/db/schema.sql");
  const schemaSql = await readFile(schemaPath, "utf8");

  await sql.unsafe(`SELECT pg_advisory_lock(${MIGRATION_ADVISORY_LOCK_ID})`);
  try {
    await sql.unsafe(schemaSql);
  } finally {
    await sql.unsafe(`SELECT pg_advisory_unlock(${MIGRATION_ADVISORY_LOCK_ID})`);
  }
}

async function runMigrationsWithRetry() {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_MIGRATION_ATTEMPTS; attempt++) {
    try {
      await applySchema();
      return;
    } catch (error) {
      lastError = error;
      console.error(
        `Migration attempt ${attempt}/${MAX_MIGRATION_ATTEMPTS} failed`,
        error
      );
      if (attempt < MAX_MIGRATION_ATTEMPTS) {
        await new Promise((resolve) =>
          setTimeout(resolve, MIGRATION_RETRY_DELAY_MS)
        );
      }
    }
  }
  throw lastError;
}

export async function runMigrations() {
  await runMigrationsWithRetry();
}
