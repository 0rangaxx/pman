import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { join } from "path";
import * as schema from "../db/schema";

const dbPath = join(process.cwd(), "sqlite.db");
const client = new Database(dbPath);
export const db = drizzle(client, { schema });
