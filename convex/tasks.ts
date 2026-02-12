import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { QueryCtx, MutationCtx } from "./_generated/server";

// Validate session token and return userId
async function validateSession(
  ctx: QueryCtx | MutationCtx,
  token: string
): Promise<Id<"users">> {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .first();
  if (!session || session.expiresAt < Date.now()) {
    throw new Error("Authentication required");
  }
  return session.userId;
}

// List all tasks for the authenticated user
export const list = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const userId = await validateSession(ctx, token);
    return await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

// Create a new task
export const create = mutation({
  args: { token: v.string(), title: v.string() },
  handler: async (ctx, { token, title }) => {
    const userId = await validateSession(ctx, token);
    const taskId = await ctx.db.insert("tasks", {
      userId,
      title: title.trim(),
      done: false,
    });
    return await ctx.db.get(taskId);
  },
});

// Toggle task done status
export const toggleDone = mutation({
  args: { token: v.string(), taskId: v.id("tasks"), done: v.boolean() },
  handler: async (ctx, { token, taskId, done }) => {
    const userId = await validateSession(ctx, token);
    const task = await ctx.db.get(taskId);
    if (!task || task.userId !== userId) {
      throw new Error("Task not found");
    }
    await ctx.db.patch(taskId, { done });
    return await ctx.db.get(taskId);
  },
});

// Delete a task
export const remove = mutation({
  args: { token: v.string(), taskId: v.id("tasks") },
  handler: async (ctx, { token, taskId }) => {
    const userId = await validateSession(ctx, token);
    const task = await ctx.db.get(taskId);
    if (!task || task.userId !== userId) {
      throw new Error("Task not found");
    }
    await ctx.db.delete(taskId);
  },
});
