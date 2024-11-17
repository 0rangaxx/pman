import { type Express } from "express";
import { eq, or, and, ne } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "./db";
import { users, prompts } from "../db/schema";
import type { User, Prompt } from "../db/schema";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

declare module "express-serve-static-core" {
  interface Request {
    user?: User;
  }
}

function authenticateToken(req: any, res: any, next: any) {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid token" });
  }
}

export function registerRoutes(app: Express) {
  // Prompt routes
  app.get("/api/prompts", authenticateToken, async (req, res) => {
    try {
      // Get all prompts that are either:
      // 1. Owned by the current user (regardless of private status)
      // 2. Public prompts (isPrivate = false) from other users
      const promptsList = await db
        .select()
        .from(prompts)
        .where(
          or(
            eq(prompts.userId, req.user!.id),
            and(
              eq(prompts.isPrivate, false),
              ne(prompts.userId, req.user!.id)
            )
          )
        );
      res.json(promptsList);
    } catch (error) {
      console.error('Error fetching prompts:', error);
      res.status(500).json({ error: "Failed to fetch prompts" });
    }
  });

  app.post("/api/prompts", authenticateToken, async (req, res) => {
    try {
      const { title, content, tags, metadata, isLiked, isNsfw, isPrivate } = req.body;
      const [prompt] = await db.insert(prompts).values({
        title,
        content,
        tags,
        metadata,
        isLiked,
        isNsfw,
        isPrivate: isPrivate ?? false, // デフォルトはfalse（公開）
        userId: req.user!.id,
      }).returning();
      res.json(prompt);
    } catch (error) {
      console.error('Error creating prompt:', error);
      res.status(500).json({ error: "Failed to create prompt" });
    }
  });

  app.put("/api/prompts/:id", authenticateToken, async (req, res) => {
    try {
      const promptId = parseInt(req.params.id);
      const { title, content, tags, metadata, isLiked, isNsfw, isPrivate } = req.body;

      // Verify ownership
      const [existingPrompt] = await db.select()
        .from(prompts)
        .where(eq(prompts.id, promptId));

      if (!existingPrompt) {
        return res.status(404).json({ error: "Prompt not found" });
      }

      if (existingPrompt.userId !== req.user!.id) {
        return res.status(403).json({ error: "Not authorized to update this prompt" });
      }

      const [updatedPrompt] = await db.update(prompts)
        .set({
          title,
          content,
          tags,
          metadata,
          isLiked,
          isNsfw,
          isPrivate,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(prompts.id, promptId))
        .returning();

      res.json(updatedPrompt);
    } catch (error) {
      console.error('Error updating prompt:', error);
      res.status(500).json({ error: "Failed to update prompt" });
    }
  });

  app.delete("/api/prompts/:id", authenticateToken, async (req, res) => {
    try {
      const promptId = parseInt(req.params.id);

      // Verify ownership
      const [existingPrompt] = await db.select()
        .from(prompts)
        .where(eq(prompts.id, promptId));

      if (!existingPrompt) {
        return res.status(404).json({ error: "Prompt not found" });
      }

      if (existingPrompt.userId !== req.user!.id) {
        return res.status(403).json({ error: "Not authorized to delete this prompt" });
      }

      await db.delete(prompts).where(eq(prompts.id, promptId));
      res.json({ message: "Prompt deleted successfully" });
    } catch (error) {
      console.error('Error deleting prompt:', error);
      res.status(500).json({ error: "Failed to delete prompt" });
    }
  });

  // User routes
  app.put("/api/users/:id/toggle-admin", authenticateToken, async (req, res) => {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const userId = parseInt(req.params.id);
      if (userId === req.user.id) {
        return res.status(400).json({ error: "Cannot modify your own admin status" });
      }

      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const [updatedUser] = await db
        .update(users)
        .set({
          isAdmin: !user.isAdmin,
          updatedAt: new Date().toISOString()
        })
        .where(eq(users.id, userId))
        .returning();

      res.json({
        message: `Admin status ${updatedUser.isAdmin ? 'granted' : 'revoked'} successfully`,
        user: updatedUser
      });
    } catch (error) {
      console.error('Toggle admin error:', error);
      res.status(500).json({ error: "Failed to update admin status" });
    }
  });

  app.delete("/api/users/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const userId = parseInt(req.params.id);
      if (userId === req.user.id) {
        return res.status(400).json({ error: "Cannot delete your own account" });
      }

      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      await db.delete(users).where(eq(users.id, userId));

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  app.post("/api/register", async (req, res) => {
    try {
      const { username, password } = req.body;
      console.log('Registering user:', username);

      const existingUser = await db.select().from(users).where(eq(users.username, username));
      if (existingUser.length > 0) {
        return res.status(400).json({ error: "Username already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const [user] = await db.insert(users).values({
        username,
        password: hashedPassword,
        isAdmin: false, // Default to false for new users
      }).returning();

      console.log('User registered successfully:', user.id);
      res.json({ user: { id: user.id, username: user.username, isAdmin: user.isAdmin } });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      const [user] = await db.select().from(users).where(eq(users.username, username));
      if (!user) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, isAdmin: user.isAdmin },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      });

      res.json({
        user: { id: user.id, username: user.username, isAdmin: user.isAdmin },
        token,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ message: "Logged out successfully" });
  });

  app.get("/api/user", authenticateToken, (req, res) => {
    res.json(req.user);
  });

  app.get("/api/users", authenticateToken, async (req, res) => {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const usersList = await db.select({
        id: users.id,
        username: users.username,
        isAdmin: users.isAdmin,
        createdAt: users.createdAt
      }).from(users);
      res.json(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.put("/api/user/settings", authenticateToken, async (req, res) => {
    try {
      const { username, currentPassword, newPassword } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "User not found" });
      }

      // Get current user
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Verify current password
      const validPassword = await bcrypt.compare(currentPassword, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }

      // Check if new username is taken (if username is being changed)
      if (username !== user.username) {
        const existingUser = await db.select().from(users).where(eq(users.username, username));
        if (existingUser.length > 0) {
          return res.status(400).json({ error: "Username already exists" });
        }
      }

      // Hash new password if provided
      const hashedPassword = newPassword ? await bcrypt.hash(newPassword, 10) : user.password;

      // Update user
      const [updatedUser] = await db
        .update(users)
        .set({
          username,
          password: hashedPassword,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(users.id, userId))
        .returning();

      res.json({
        message: "Settings updated successfully",
        user: { id: updatedUser.id, username: updatedUser.username, isAdmin: updatedUser.isAdmin }
      });
    } catch (error) {
      console.error('Settings update error:', error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "healthy" });
  });
}
