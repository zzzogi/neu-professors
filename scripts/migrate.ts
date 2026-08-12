import { config } from "dotenv";
config({ path: ".env.local" }); // Next.js convention; loaded first
config(); // fallback to .env (does not override already-set vars)
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { migrate } from "drizzle-orm/neon-http/migrator";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL chưa được cấu hình.");

  const sql = neon(url);
  const db = drizzle(sql);

  console.log("Đang chạy migrations...");
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Hoàn tất migrations.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
