import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

// Get tasks for current user
export const getMyTasks = query({
  args: {
    status: v.optional(v.union(v.literal("pending"), v.literal("in_progress"), v.literal("completed"), v.literal("overdue"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let query = ctx.db
      .query("tasks")
      .withIndex("by_assigned_to", (q) => q.eq("assignedTo", userId));

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    const tasks = await query.order("desc").collect();

    // Get assignor info for each task
    const tasksWithAssignors = await Promise.all(
      tasks.map(async (task) => {
        const assignor = await ctx.db.get(task.assignedBy);
        const assignorProfile = await ctx.db
          .query("userProfiles")
          .withIndex("by_user_id", (q) => q.eq("userId", task.assignedBy))
          .unique();

        return {
          ...task,
          assignedByName: assignorProfile 
            ? `${assignorProfile.firstName} ${assignorProfile.lastName}` 
            : assignor?.email || "Unknown",
        };
      })
    );

    return tasksWithAssignors;
  },
});

// Get all tasks (admin view)
export const getAllTasks = query({
  args: {
    assignedTo: v.optional(v.id("users")),
    status: v.optional(v.union(v.literal("pending"), v.literal("in_progress"), v.literal("completed"), v.literal("overdue"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    if (!userProfile || userProfile.role !== "admin") {
      throw new Error("Admin access required");
    }

    const tasks = args.assignedTo
      ? await ctx.db.query("tasks").withIndex("by_assigned_to", (q) => q.eq("assignedTo", args.assignedTo!)).order("desc").collect()
      : await ctx.db.query("tasks").order("desc").collect();

    // Filter by status if provided
    let filteredTasks = tasks;
    if (args.status) {
      filteredTasks = tasks.filter(task => task.status === args.status);
    }

    // Get user info for each task
    const tasksWithUsers = await Promise.all(
      filteredTasks.map(async (task) => {
        const assignee = await ctx.db.get(task.assignedTo);
        const assigneeProfile = await ctx.db
          .query("userProfiles")
          .withIndex("by_user_id", (q) => q.eq("userId", task.assignedTo))
          .unique();

        const assignor = await ctx.db.get(task.assignedBy);
        const assignorProfile = await ctx.db
          .query("userProfiles")
          .withIndex("by_user_id", (q) => q.eq("userId", task.assignedBy))
          .unique();

        return {
          ...task,
          assignedToName: assigneeProfile 
            ? `${assigneeProfile.firstName} ${assigneeProfile.lastName}` 
            : assignee?.email || "Unknown",
          assignedByName: assignorProfile 
            ? `${assignorProfile.firstName} ${assignorProfile.lastName}` 
            : assignor?.email || "Unknown",
        };
      })
    );

    return tasksWithUsers;
  },
});

// Create task
export const createTask = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    assignedTo: v.id("users"),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
    dueDate: v.number(),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    if (!userProfile || userProfile.role !== "admin") {
      throw new Error("Admin access required");
    }

    const taskId = await ctx.db.insert("tasks", {
      title: args.title,
      description: args.description,
      assignedTo: args.assignedTo,
      assignedBy: userId,
      status: "pending",
      priority: args.priority,
      dueDate: args.dueDate,
      tags: args.tags,
    });

    // Create notification for assigned user
    await ctx.runMutation(api.notifications.createNotification, {
      userId: args.assignedTo,
      title: "New Task Assigned",
      message: `You have been assigned a new task: ${args.title}`,
      type: "task",
      relatedEntityId: taskId,
      relatedEntityType: "task",
    });

    // Log the action
    await ctx.db.insert("auditLogs", {
      userId,
      action: "create_task",
      entityType: "task",
      entityId: taskId,
      details: {
        after: args,
      },
    });

    return taskId;
  },
});

// Update task
export const updateTask = mutation({
  args: {
    taskId: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.union(v.literal("pending"), v.literal("in_progress"), v.literal("completed"), v.literal("overdue"))),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent"))),
    dueDate: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    // Check if user can update this task (admin or assignee)
    if (!userProfile || 
        (userProfile.role !== "admin" && task.assignedTo !== userId)) {
      throw new Error("Permission denied");
    }

    const updates: any = {};
    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.status !== undefined) {
      updates.status = args.status;
      if (args.status === "completed") {
        updates.completedAt = Date.now();
        
        // Create notification for task completion
        await ctx.runMutation(api.notifications.createNotification, {
          userId: task.assignedBy,
          title: "Task Completed",
          message: `Task "${task.title}" has been completed`,
          type: "task",
          relatedEntityId: args.taskId,
          relatedEntityType: "task",
        });
      }
    }
    if (args.priority !== undefined) updates.priority = args.priority;
    if (args.dueDate !== undefined) updates.dueDate = args.dueDate;
    if (args.tags !== undefined) updates.tags = args.tags;

    await ctx.db.patch(args.taskId, updates);

    // Log the action
    await ctx.db.insert("auditLogs", {
      userId,
      action: "update_task",
      entityType: "task",
      entityId: args.taskId,
      details: {
        before: task,
        after: updates,
      },
    });

    return args.taskId;
  },
});

// Delete task
export const deleteTask = mutation({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    if (!userProfile || userProfile.role !== "admin") {
      throw new Error("Admin access required");
    }

    await ctx.db.delete(args.taskId);

    // Log the action
    await ctx.db.insert("auditLogs", {
      userId,
      action: "delete_task",
      entityType: "task",
      entityId: args.taskId,
      details: {
        before: task,
      },
    });

    return args.taskId;
  },
});

// Update overdue tasks
export const updateOverdueTasks = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    // Find tasks that are past due but not completed or already marked as overdue
    const overdueTasks = await ctx.db
      .query("tasks")
      .filter((q) => 
        q.and(
          q.lt(q.field("dueDate"), now),
          q.neq(q.field("status"), "completed"),
          q.neq(q.field("status"), "overdue")
        )
      )
      .collect();

    // Update each overdue task
    for (const task of overdueTasks) {
      await ctx.db.patch(task._id, { status: "overdue" });
      
      // Create notification for overdue task
      await ctx.runMutation(api.notifications.createNotification, {
        userId: task.assignedTo,
        title: "Task Overdue",
        message: `Task "${task.title}" is now overdue`,
        type: "reminder",
        relatedEntityId: task._id,
        relatedEntityType: "task",
      });
    }

    return { updated: overdueTasks.length };
  },
});

// Get task statistics
export const getTaskStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    if (!userProfile) throw new Error("User profile not found");

    let tasks;
    if (userProfile.role === "admin") {
      tasks = await ctx.db.query("tasks").collect();
    } else {
      tasks = await ctx.db
        .query("tasks")
        .withIndex("by_assigned_to", (q) => q.eq("assignedTo", userId))
        .collect();
    }

    // Calculate overdue tasks dynamically but only count those explicitly marked as overdue
    const now = Date.now();
    const stats = {
      total: tasks.length,
      pending: tasks.filter(t => t.status === "pending").length,
      inProgress: tasks.filter(t => t.status === "in_progress").length,
      completed: tasks.filter(t => t.status === "completed").length,
      overdue: tasks.filter(t => t.status === "overdue").length,
    };

    return stats;
  },
});
