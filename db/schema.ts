import { sql } from "drizzle-orm";
import { text, integer, sqliteTable } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: integer("is_admin", { mode: "boolean" }).default(false),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const prompts = sqliteTable("prompts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  tags: text("tags", { mode: "json" }).$type<string[]>(),
  metadata: text("metadata", { mode: "json" }).$type<Record<string, string>>(),
  isLiked: integer("is_liked", { mode: "boolean" }).default(false),
  isNsfw: integer("is_nsfw", { mode: "boolean" }).default(false),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  userId: integer("user_id").references(() => users.id),
});

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export type User = z.infer<typeof selectUserSchema>;

export const insertPromptSchema = createInsertSchema(prompts);
export const selectPromptSchema = createSelectSchema(prompts);
export type Prompt = z.infer<typeof selectPromptSchema>;
