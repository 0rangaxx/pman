import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: integer("is_admin", { mode: 'boolean' }).default(false),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`)
});

const prompts = sqliteTable("prompts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  tags: text("tags", { mode: 'json' }).$type<string[]>(),
  metadata: text("metadata", { mode: 'json' }).$type<Record<string, string>>(),
  isLiked: integer("is_liked", { mode: 'boolean' }).default(false),
  isNsfw: integer("is_nsfw", { mode: 'boolean' }).default(false),
  isPrivate: integer("is_private", { mode: 'boolean' }).default(false),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  userId: integer("user_id").references(() => users.id)
});

// Custom Zod schema to handle boolean conversion
const booleanSchema = z.union([
  z.boolean(),
  z.number().transform(val => val === 1),
  z.null().transform(() => false)
]);

const jsonArraySchema = z.array(z.string()).optional().transform(val => val || []);
const jsonObjectSchema = z.record(z.string(), z.string()).optional().transform(val => val || {});

const insertUserSchema = createInsertSchema(users, {
  isAdmin: booleanSchema
});

const selectUserSchema = createSelectSchema(users, {
  isAdmin: booleanSchema
});

const insertPromptSchema = createInsertSchema(prompts, {
  isLiked: booleanSchema,
  isNsfw: booleanSchema,
  isPrivate: booleanSchema,
  tags: jsonArraySchema,
  metadata: jsonObjectSchema
});

const selectPromptSchema = createSelectSchema(prompts, {
  isLiked: booleanSchema,
  isNsfw: booleanSchema,
  isPrivate: booleanSchema,
  tags: jsonArraySchema,
  metadata: jsonObjectSchema
});

// Utility functions for type conversion
function toBoolean(value: number | boolean | null | undefined): boolean {
  if (typeof value === 'boolean') return value;
  return value === 1 || value === true;
}

function toInteger(value: boolean | number): number {
  return value === true || value === 1 ? 1 : 0;
}

// Flexible type definitions
type Prompt = {
  id: number;
  title: string;
  content: string;
  tags?: string[];
  metadata?: Record<string, string>;
  isLiked: boolean;
  isNsfw: boolean;
  isPrivate: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
  userId?: number | null;
};

type NewPrompt = Partial<Omit<Prompt, 'id'>> & {
  title: string;
  content: string;
};

export {
  Prompt,
  NewPrompt,
  insertPromptSchema,
  insertUserSchema,
  prompts,
  selectPromptSchema,
  selectUserSchema,
  users,
  toBoolean,
  toInteger
};
