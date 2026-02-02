import express from "express";
import { storage } from "./storage.js";
import { z } from "zod";

const router = express.Router();

// Validation schemas using Zod
const insertUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const updateUserSchema = z.object({
  username: z.string().min(1).optional(),
  password: z.string().min(1).optional(),
});

/**
 * Health check endpoint
 */
router.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

/**
 * Get all users
 */
router.get("/users", async (req, res, next) => {
  try {
    const users = await storage.getAllUsers();
    // Don't expose passwords in response
    const sanitizedUsers = users.map(({ password, ...user }) => user);
    res.json(sanitizedUsers);
  } catch (error) {
    next(error);
  }
});

/**
 * Get user by ID
 */
router.get("/users/:id", async (req, res, next) => {
  try {
    const user = await storage.getUser(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    // Don't expose password in response
    const { password, ...sanitizedUser } = user;
    res.json(sanitizedUser);
  } catch (error) {
    next(error);
  }
});

/**
 * Create a new user
 */
router.post("/users", async (req, res, next) => {
  try {
    const validation = insertUserSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: "Validation failed", 
        details: validation.error.errors 
      });
    }

    // Check if username already exists - use generic error to prevent username enumeration
    const existingUser = await storage.getUserByUsername(validation.data.username);
    if (existingUser) {
      return res.status(400).json({ error: "Registration failed" });
    }

    const user = await storage.createUser(validation.data);
    // Don't expose password in response
    const { password, ...sanitizedUser } = user;
    res.status(201).json(sanitizedUser);
  } catch (error) {
    next(error);
  }
});

/**
 * Update user by ID
 */
router.put("/users/:id", async (req, res, next) => {
  try {
    const validation = updateUserSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: "Validation failed", 
        details: validation.error.errors 
      });
    }

    // Check if user exists
    const existingUser = await storage.getUser(req.params.id);
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // If updating username, check it doesn't already exist
    if (validation.data.username && validation.data.username !== existingUser.username) {
      const userWithUsername = await storage.getUserByUsername(validation.data.username);
      if (userWithUsername) {
        return res.status(409).json({ error: "Username already exists" });
      }
    }

    const user = await storage.updateUser(req.params.id, validation.data);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    // Don't expose password in response
    const { password, ...sanitizedUser } = user;
    res.json(sanitizedUser);
  } catch (error) {
    next(error);
  }
});

/**
 * Delete user by ID
 */
router.delete("/users/:id", async (req, res, next) => {
  try {
    const deleted = await storage.deleteUser(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
