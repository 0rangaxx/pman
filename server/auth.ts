import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { users, loginSchema, registerSchema } from "../db/schema";
import { eq } from "drizzle-orm";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

export async function registerUser(req: Request, res: Response) {
  try {
    const data = registerSchema.parse(req.body);
    const hashedPassword = await hashPassword(data.password);
    
    const existingUser = await db.select().from(users).where(eq(users.email, data.email));
    if (existingUser.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const [user] = await db.insert(users).values({
      email: data.email,
      hashedPassword,
      name: data.name,
    }).returning();

    req.session.userId = user.id;
    
    return res.json({
      id: user.id,
      email: user.email,
      name: user.name,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(400).json({ error: "Invalid registration data" });
  }
}

export async function loginUser(req: Request, res: Response) {
  try {
    const data = loginSchema.parse(req.body);
    
    const [user] = await db.select().from(users).where(eq(users.email, data.email));
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const isValid = await verifyPassword(data.password, user.hashedPassword);
    if (!isValid) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    req.session.userId = user.id;
    
    return res.json({
      id: user.id,
      email: user.email,
      name: user.name,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(400).json({ error: "Invalid login data" });
  }
}

export async function logoutUser(req: Request, res: Response) {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ error: "Error during logout" });
    }
    res.clearCookie("connect.sid");
    return res.json({ message: "Logged out successfully" });
  });
}

export async function getCurrentUser(req: Request, res: Response) {
  if (!req.session.userId) {
    return res.json(null);
  }

  try {
    const [user] = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
    }).from(users).where(eq(users.id, req.session.userId));

    return res.json(user || null);
  } catch (error) {
    console.error("Get current user error:", error);
    return res.status(500).json({ error: "Error fetching user" });
  }
}
