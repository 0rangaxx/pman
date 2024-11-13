import { type Express } from "express";
import { setupAuth } from "./auth";
import { db } from "db";
import { prompts, insertPromptSchema } from "db/schema";
import { eq } from "drizzle-orm";

export function registerRoutes(app: Express) {
  setupAuth(app);

  // Prompt CRUD endpoints
  app.get("/api/prompts", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userPrompts = await db
      .select()
      .from(prompts)
      .where(eq(prompts.userId, req.user.id));
    res.json(userPrompts);
  });

  app.post("/api/prompts", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = insertPromptSchema.safeParse({ ...req.body, userId: req.user.id });
    if (!result.success) {
      return res.status(400).json({ errors: result.error.flatten() });
    }

    const [prompt] = await db.insert(prompts).values(result.data).returning();
    res.json(prompt);
  });

  app.put("/api/prompts/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = insertPromptSchema.safeParse({ ...req.body, userId: req.user.id });
    if (!result.success) {
      return res.status(400).json({ errors: result.error.flatten() });
    }

    const [prompt] = await db
      .update(prompts)
      .set(result.data)
      .where(eq(prompts.id, parseInt(req.params.id)))
      .returning();
    res.json(prompt);
  });

  app.delete("/api/prompts/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await db.delete(prompts).where(eq(prompts.id, parseInt(req.params.id)));
    res.json({ success: true });
  });
}
