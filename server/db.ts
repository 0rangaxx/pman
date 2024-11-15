import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Create PostgreSQL client
const client = postgres(process.env.DATABASE_URL!);

// Create Drizzle instance
export const db = drizzle(client);
