import "dotenv/config";
import { Pool } from "pg";
import { migrateDatabase } from "../src/db/migrate";

async function main() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) throw new Error("Add DATABASE_URL to your environment before running db:migrate.");
  const pool = new Pool({ connectionString: url, connectionTimeoutMillis: 10000 });
  try {
    await migrateDatabase(pool);
    console.log("Database schema and row-level security are ready. No demo accounts were created.");
  } finally {
    await pool.end();
  }
}
main().catch(() => { console.error("Database setup failed. Check connection, TLS and owner permissions. No credentials were logged."); process.exitCode = 1; });
