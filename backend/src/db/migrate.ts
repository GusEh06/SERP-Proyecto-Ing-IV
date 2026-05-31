import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { sql } from "./client";

export async function runMigrations() {
  const schemaPath = resolve(process.cwd(), "src/db/schema.sql");
  const schemaSql = await readFile(schemaPath, "utf8");
  await sql.unsafe(schemaSql);
}
