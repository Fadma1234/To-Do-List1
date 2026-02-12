"use node";

import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export const register = action({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, { email, password }) => {
    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    // Check if user already exists
    const existing = await ctx.runQuery(internal.authHelpers.getUserByEmail, {
      email,
    });
    if (existing) {
      throw new Error("Email already registered");
    }

    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = await ctx.runMutation(internal.authHelpers.createUser, {
      email,
      passwordHash,
    });

    // Create session
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
    await ctx.runMutation(internal.authHelpers.createSession, {
      userId,
      token,
      expiresAt,
    });

    return { token, user: { id: userId, email } };
  },
});

export const login = action({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, { email, password }) => {
    const user = await ctx.runQuery(internal.authHelpers.getUserByEmail, {
      email,
    });
    if (!user) {
      throw new Error("Invalid email or password");
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new Error("Invalid email or password");
    }

    // Create session
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    await ctx.runMutation(internal.authHelpers.createSession, {
      userId: user._id,
      token,
      expiresAt,
    });

    return { token, user: { id: user._id, email: user.email } };
  },
});
