import type { Config } from "drizzle-kit";
import { join } from "path";

export default {
  schema: "./db/schema.ts",
  out: "./migrations",
  driver: "better-sqlite3",
  dbCredentials: {
    url: join(process.cwd(), "sqlite.db")
  }
} satisfies Config;
