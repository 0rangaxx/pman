import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { join } from "path";
import * as schema from "../db/schema";
import { existsSync } from "fs";
import { promisify } from "util";

const dbPath = join(process.cwd(), "sqlite.db");
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const sleep = promisify(setTimeout);

class DatabaseError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'DatabaseError';
  }
}

let dbInstance: ReturnType<typeof drizzle> | null = null;
let connectionPromise: Promise<ReturnType<typeof drizzle>> | null = null;
let isInitializing = false;

async function verifyTables(client: Database.Database): Promise<void> {
  const tables = client
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    .all() as { name: string }[];

  console.log("Available tables:", tables.map(t => t.name).join(", "));

  const requiredTables = ['users', 'prompts'];
  const missingTables = requiredTables.filter(table => 
    !tables.some(t => t.name === table)
  );

  if (missingTables.length > 0) {
    throw new DatabaseError(`Missing required tables: ${missingTables.join(", ")}`);
  }

  // Verify table structure
  for (const table of requiredTables) {
    try {
      client.prepare(`SELECT * FROM ${table} LIMIT 0`).run();
    } catch (error) {
      throw new DatabaseError(`Invalid table structure for ${table}`, error);
    }
  }
}

async function initializeDatabase(): Promise<ReturnType<typeof drizzle>> {
  console.log("Starting database initialization...");
  
  const dbExists = existsSync(dbPath);
  if (!dbExists) {
    console.log("Database file not found, will create new one at:", dbPath);
  }

  let client: Database.Database | null = null;
  try {
    client = new Database(dbPath, {
      verbose: process.env.NODE_ENV === 'development' ? console.log : undefined,
      timeout: 30000,
      fileMustExist: false
    });

    // Configure SQLite for better reliability
    client.pragma('journal_mode = WAL');
    client.pragma('busy_timeout = 30000');
    client.pragma('foreign_keys = ON');
    client.pragma('synchronous = NORMAL');
    client.pragma('cache_size = -64000');
    client.pragma('temp_store = MEMORY');

    // Basic connection test
    client.prepare("SELECT 1").get();
    console.log("Basic database connection test successful");

    // Verify tables existence and structure
    await verifyTables(client);
    console.log("Table verification successful");

    // Create drizzle instance
    const db = drizzle(client, { schema });
    return db;
  } catch (error) {
    if (client) {
      try {
        client.close();
      } catch (closeError) {
        console.error("Error closing database connection:", closeError);
      }
    }
    throw new DatabaseError(
      `Database initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error
    );
  }
}

export async function getDb() {
  if (dbInstance) {
    try {
      // Verify the connection is still valid
      await dbInstance.select().from(schema.users).limit(1);
      return dbInstance;
    } catch (error) {
      console.log("Existing connection invalid, reinitializing...");
      dbInstance = null;
    }
  }
  
  if (connectionPromise) {
    console.log("Waiting for existing database connection attempt...");
    return connectionPromise;
  }
  
  if (isInitializing) {
    throw new DatabaseError('Database initialization already in progress');
  }
  
  try {
    isInitializing = true;
    console.log("Initializing new database connection...");

    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        connectionPromise = initializeDatabase();
        dbInstance = await connectionPromise;
        console.log("Database connection established and verified successfully");
        return dbInstance;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`Database connection attempt ${attempt}/${MAX_RETRIES} failed:`, {
          error: lastError,
          stack: lastError.stack
        });

        if (attempt < MAX_RETRIES) {
          console.log(`Waiting ${RETRY_DELAY}ms before retry...`);
          await sleep(RETRY_DELAY);
        }
      }
    }

    throw new DatabaseError(
      `Failed to establish database connection after ${MAX_RETRIES} attempts`,
      lastError
    );
  } catch (error) {
    console.error("Failed to establish database connection:", error);
    dbInstance = null;
    throw error;
  } finally {
    isInitializing = false;
    connectionPromise = null;
  }
}

// Export the db interface with getInstance method
export const db = {
  async getInstance() {
    return await getDb();
  },
  async select() {
    const dbConn = await getDb();
    return dbConn.select();
  },
  async insert(table: any) {
    const dbConn = await getDb();
    return dbConn.insert(table);
  },
  async update(table: any) {
    const dbConn = await getDb();
    return dbConn.update(table);
  },
  async delete(table: any) {
    const dbConn = await getDb();
    return dbConn.delete(table);
  },
  async transaction<T>(callback: (tx: ReturnType<typeof drizzle>) => Promise<T>) {
    const dbConn = await getDb();
    return callback(dbConn);
  }
};