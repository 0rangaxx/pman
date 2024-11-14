import { type Express } from "express";

export function registerRoutes(app: Express) {
  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "healthy" });
  });
}
