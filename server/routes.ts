import { type Express } from "express";
import { db } from "db";
import { prompts, insertPromptSchema } from "db/schema";
import { eq } from "drizzle-orm";

export function registerRoutes(app: Express) {
  // Prompt CRUD endpoints
  app.get("/api/prompts", async (_req, res) => {
    const allPrompts = await db.select().from(prompts);
    res.json(allPrompts);
  });

  app.post("/api/prompts", async (req, res) => {
    const result = insertPromptSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ errors: result.error.flatten() });
    }

    const [prompt] = await db.insert(prompts).values(result.data).returning();
    res.json(prompt);
  });

  app.put("/api/prompts/:id", async (req, res) => {
    try {
      const result = insertPromptSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ errors: result.error.flatten() });
      }

      const [prompt] = await db
        .update(prompts)
        .set({
          ...result.data,
          updatedAt: new Date(),
        })
        .where(eq(prompts.id, parseInt(req.params.id)))
        .returning();

      if (!prompt) {
        return res.status(404).json({ error: "Prompt not found" });
      }

      res.json(prompt);
    } catch (error) {
      console.error('Error updating prompt:', error);
      res.status(500).json({ error: 'Failed to update prompt' });
    }
  });

  app.delete("/api/prompts/:id", async (req, res) => {
    await db.delete(prompts).where(eq(prompts.id, parseInt(req.params.id)));
    res.json({ success: true });
  });
}
