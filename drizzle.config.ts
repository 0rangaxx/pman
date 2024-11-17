import { defineConfig } from "drizzle-kit";
import { join } from "path";

export default defineConfig({
  out: "./migrations",
  schema: "./db/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: `file:${join(process.cwd(), "sqlite.db")}`
  },
});
