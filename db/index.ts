import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import { join } from "path";

// Initialize SQLite database with verbose logging for debugging
const sqlite = new Database(join(process.cwd(), "sqlite.db"), { verbose: console.log });

// Enable foreign keys support and WAL mode for better concurrency
sqlite.pragma('foreign_keys = ON');
sqlite.pragma('journal_mode = WAL');

// Create database instance with schema
export const db = drizzle(sqlite, { schema });

// Verify database connection and initialize tables
console.log('Initializing database connection...');
try {
  // Test database connection
  sqlite.prepare('SELECT 1').get();
  console.log('Database connection initialized successfully');

  // Create users table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      is_admin INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create prompts table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS prompts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      tags TEXT,
      metadata TEXT,
      is_liked INTEGER DEFAULT 0,
      is_nsfw INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      user_id INTEGER REFERENCES users(id)
    )
  `);

  console.log('Tables initialized successfully');
} catch (error) {
  console.error('Error initializing database:', error);
  process.exit(1);
}