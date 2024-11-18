import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import Database from "better-sqlite3";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";

const dbPath = join(process.cwd(), "sqlite.db");
const migrationsPath = join(process.cwd(), "migrations");

class MigrationError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'MigrationError';
  }
}

async function main() {
  console.log("Starting database migration process...");
  let client: Database.Database | null = null;
  
  try {
    // Create migrations directory if it doesn't exist
    if (!existsSync(migrationsPath)) {
      console.log("Creating migrations directory...");
      mkdirSync(migrationsPath, { recursive: true });
    }

    // Initialize SQLite connection with better error handling
    try {
      client = new Database(dbPath, {
        verbose: process.env.NODE_ENV === 'development' ? console.log : undefined,
        timeout: 30000, // 30 seconds timeout
        fileMustExist: false // Allow creating new database
      });

      // Configure SQLite for better reliability
      client.pragma('journal_mode = WAL');
      client.pragma('busy_timeout = 30000');
      client.pragma('foreign_keys = ON');
      client.pragma('synchronous = NORMAL');
      client.pragma('cache_size = -64000'); // 64MB cache
      client.pragma('temp_store = MEMORY');
    } catch (error) {
      throw new MigrationError("Failed to initialize database connection", error);
    }

    // Verify database connection
    try {
      client.prepare("SELECT 1").get();
      console.log("Database connection verified");
    } catch (error) {
      throw new MigrationError("Failed to verify database connection", error);
    }

    // Initialize drizzle
    const db = drizzle(client);

    // Run migrations
    console.log("Applying migrations...");
    await migrate(db, { migrationsFolder: migrationsPath });

    // Verify final state
    const tables = client
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
      .all() as { name: string }[];
    
    if (tables.length === 0) {
      throw new MigrationError("No tables were created after migration");
    }

    console.log("Final database tables:", tables.map(t => t.name).join(", "));
    console.log("Migration completed successfully");

  } catch (error) {
    console.error("Migration error:", error instanceof Error ? error.message : String(error));
    if (error instanceof MigrationError && error.cause) {
      console.error("Caused by:", error.cause);
    }
    process.exit(1);
  } finally {
    if (client) {
      try {
        client.close();
      } catch (error) {
        console.error("Error closing database connection:", error);
      }
    }
  }
}

main().catch((error) => {
  console.error("Migration script failed:", error);
  process.exit(1);
});
