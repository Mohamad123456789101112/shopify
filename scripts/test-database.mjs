// Isolated local PostgreSQL for integration tests only, never used in production.
import { mkdir, mkdtemp } from "node:fs/promises";
import { join } from "node:path";
import EmbeddedPostgres from "embedded-postgres";
await mkdir(".test-db", { recursive: true });
const databaseDir = await mkdtemp(join(process.cwd(), ".test-db/cluster-"));
const db = new EmbeddedPostgres({ databaseDir, user: "postgres", password: "local-integration-only", port: 55432, initdbFlags: ["--locale=C", "--lc-messages=C", "--encoding=UTF8"], postgresFlags: ["-h", "127.0.0.1", "-k", "/tmp"], persistent: false, onLog: () => {} });
await db.initialise();
await db.start();
await db.createDatabase("bly_test");
console.log("Integration PostgreSQL ready on port 55432");
async function stop() { await db.stop(); process.exit(0); }
process.on("SIGTERM", stop);
process.on("SIGINT", stop);
setInterval(() => {}, 60000);
