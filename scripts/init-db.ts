// Run once after creating the Turso DB and setting env vars locally:
//   TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... npx tsx scripts/init-db.ts
import { initDb } from "../lib/db";

initDb()
  .then(() => {
    console.log("egoff-orders: orders + newsletter tables ready.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("initDb failed:", err);
    process.exit(1);
  });
