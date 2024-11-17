import { defineConfig } from "drizzle-kit";
import { join } from "path";

export default defineConfig({
  out: "./migrations",
  schema: "./db/schema.ts",
  driver: "better-sqlite",
  dbCredentials: {
    url: join(process.cwd(), "sqlite.db")
  },
});
