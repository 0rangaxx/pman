import { type Express } from "express";
import { registerUser, loginUser, logoutUser, getCurrentUser, requireAuth } from "./auth";
import { db } from "./db";
import { prompts } from "../db/schema";
import { eq } from "drizzle-orm";

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

export function registerRoutes(app: Express) {
  // Auth routes
  app.post("/api/auth/register", registerUser);
  app.post("/api/auth/login", loginUser);
  app.post("/api/auth/logout", logoutUser);
  app.get("/api/auth/user", getCurrentUser);

  // Protected routes
  app.get("/api/prompts", requireAuth, async (req, res) => {
    try {
      const userPrompts = await db
        .select()
        .from(prompts)
        .where(eq(prompts.userId, req.session.userId));
      res.json(userPrompts);
    } catch (error) {
      console.error("Error fetching prompts:", error);
      res.status(500).json({ error: "Error fetching prompts" });
    }
  });

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "healthy" });
  });
}
