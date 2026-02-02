import { eq } from "drizzle-orm";
import { db } from "./db.js";
import { users } from "./schema.js";
import crypto from "crypto";

/**
 * Storage interface implementation using PostgreSQL with Drizzle ORM
 * Works seamlessly with Render PostgreSQL database
 */
class PostgresStorage {
  /**
   * Get a user by ID
   * @param {string} id - User ID
   * @returns {Promise<object|undefined>} User object or undefined
   */
  async getUser(id) {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  /**
   * Get a user by username
   * @param {string} username - Username
   * @returns {Promise<object|undefined>} User object or undefined
   */
  async getUserByUsername(username) {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  /**
   * Create a new user
   * @param {object} insertUser - User data to insert
   * @param {string} insertUser.username - Username
   * @param {string} insertUser.password - Password
   * @returns {Promise<object>} Created user object
   */
  async createUser(insertUser) {
    const id = crypto.randomUUID();
    const result = await db
      .insert(users)
      .values({ ...insertUser, id })
      .returning();
    return result[0];
  }

  /**
   * Get all users
   * @returns {Promise<object[]>} Array of all users
   */
  async getAllUsers() {
    return await db.select().from(users);
  }

  /**
   * Delete a user by ID
   * @param {string} id - User ID
   * @returns {Promise<boolean>} True if user was deleted
   */
  async deleteUser(id) {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  /**
   * Update a user
   * @param {string} id - User ID
   * @param {object} updates - Fields to update
   * @returns {Promise<object|undefined>} Updated user or undefined
   */
  async updateUser(id, updates) {
    const result = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }
}

export const storage = new PostgresStorage();
