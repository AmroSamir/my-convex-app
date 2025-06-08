import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();

    return {
      _id: user._id,
      email: user.email,
      profile,
    };
  },
});

export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const currentUserProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();

    if (!currentUserProfile || currentUserProfile.role !== "admin") {
      throw new Error("Not authorized");
    }

    const users = await ctx.db.query("users").collect();
    const profiles = await ctx.db.query("userProfiles").collect();

    return users.map((user) => {
      const profile = profiles.find((p) => p.userId === user._id);
      return {
        _id: user._id,
        email: user.email,
        profile,
      };
    }).filter((user) => user.profile);
  },
});

// Create a new user with email and profile
export const createUser = mutation({
  args: {
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    role: v.union(v.literal("admin"), v.literal("employee"), v.literal("client")),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"), v.literal("pending"))),
    department: v.optional(v.string()),
    phone: v.optional(v.string()),
    availableRoles: v.optional(v.array(v.union(v.literal("admin"), v.literal("employee"), v.literal("client")))),
    canSwitchRoles: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Not authenticated");
    }

    const currentUserProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", currentUserId))
      .first();

    if (!currentUserProfile || currentUserProfile.role !== "admin") {
      throw new Error("Not authorized");
    }

    // Check if user with this email already exists
    const existingUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Create the user account
    const userId = await ctx.db.insert("users", {
      email: args.email,
      emailVerificationTime: Date.now(), // Auto-verify for admin-created users
    });

    // Create the user profile
    const profileData: any = {
      userId,
      firstName: args.firstName,
      lastName: args.lastName,
      role: args.role,
      status: args.status || "active",
      createdBy: currentUserId,
    };

    if (args.department) profileData.department = args.department;
    if (args.phone) profileData.phone = args.phone;
    if (args.availableRoles) profileData.availableRoles = args.availableRoles;
    if (args.canSwitchRoles !== undefined) profileData.canSwitchRoles = args.canSwitchRoles;

    const profileId = await ctx.db.insert("userProfiles", profileData);

    return { userId, profileId };
  },
});

export const createUserProfile = mutation({
  args: {
    userId: v.id("users"),
    firstName: v.string(),
    lastName: v.string(),
    role: v.union(v.literal("admin"), v.literal("employee"), v.literal("client")),
    department: v.optional(v.string()),
    phone: v.optional(v.string()),
    availableRoles: v.optional(v.array(v.union(v.literal("admin"), v.literal("employee"), v.literal("client")))),
    canSwitchRoles: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Not authenticated");
    }

    const currentUserProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", currentUserId))
      .first();

    if (!currentUserProfile || currentUserProfile.role !== "admin") {
      throw new Error("Not authorized");
    }

    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();

    if (existingProfile) {
      throw new Error("User profile already exists");
    }

    const profileData: any = {
      userId: args.userId,
      firstName: args.firstName,
      lastName: args.lastName,
      role: args.role,
      status: "active" as const,
      createdBy: currentUserId,
    };

    if (args.department) profileData.department = args.department;
    if (args.phone) profileData.phone = args.phone;
    if (args.availableRoles) profileData.availableRoles = args.availableRoles;
    if (args.canSwitchRoles !== undefined) profileData.canSwitchRoles = args.canSwitchRoles;

    return await ctx.db.insert("userProfiles", profileData);
  },
});

export const updateUserProfile = mutation({
  args: {
    profileId: v.id("userProfiles"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    role: v.optional(v.union(v.literal("admin"), v.literal("employee"), v.literal("client"))),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"), v.literal("pending"))),
    department: v.optional(v.string()),
    phone: v.optional(v.string()),
    availableRoles: v.optional(v.array(v.union(v.literal("admin"), v.literal("employee"), v.literal("client")))),
    canSwitchRoles: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const currentUserProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();

    if (!currentUserProfile || currentUserProfile.role !== "admin") {
      throw new Error("Not authorized");
    }

    const updateData: any = {};
    if (args.firstName !== undefined) updateData.firstName = args.firstName;
    if (args.lastName !== undefined) updateData.lastName = args.lastName;
    if (args.role !== undefined) updateData.role = args.role;
    if (args.status !== undefined) updateData.status = args.status;
    if (args.department !== undefined) updateData.department = args.department;
    if (args.phone !== undefined) updateData.phone = args.phone;
    if (args.availableRoles !== undefined) updateData.availableRoles = args.availableRoles;
    if (args.canSwitchRoles !== undefined) updateData.canSwitchRoles = args.canSwitchRoles;

    return await ctx.db.patch(args.profileId, updateData);
  },
});

export const switchRole = mutation({
  args: {
    newRole: v.union(v.literal("admin"), v.literal("employee"), v.literal("client")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();

    if (!userProfile) {
      throw new Error("User profile not found");
    }

    // Check if user can switch roles
    if (!userProfile.canSwitchRoles) {
      throw new Error("Role switching is not enabled for this user");
    }

    // Check if the new role is in available roles
    if (!userProfile.availableRoles || !userProfile.availableRoles.includes(args.newRole)) {
      throw new Error("You don't have permission to switch to this role");
    }

    // Update the current active role
    await ctx.db.patch(userProfile._id, {
      currentActiveRole: args.newRole,
    });

    // Log the role switch
    await ctx.db.insert("auditLogs", {
      userId,
      action: "role_switch",
      entityType: "userProfile",
      entityId: userProfile._id,
      details: {
        before: { role: userProfile.currentActiveRole || userProfile.role },
        after: { role: args.newRole },
        metadata: { timestamp: Date.now() },
      },
    });

    return { success: true, newRole: args.newRole };
  },
});

export const deleteUserProfile = mutation({
  args: {
    profileId: v.id("userProfiles"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const currentUserProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();

    if (!currentUserProfile || currentUserProfile.role !== "admin") {
      throw new Error("Not authorized");
    }

    const profileToDelete = await ctx.db.get(args.profileId);
    if (!profileToDelete) {
      throw new Error("Profile not found");
    }

    // Don't allow deleting the last admin
    if (profileToDelete.role === "admin") {
      const adminCount = await ctx.db
        .query("userProfiles")
        .filter((q) => q.eq(q.field("role"), "admin"))
        .collect();

      if (adminCount.length <= 1) {
        throw new Error("Cannot delete the last admin user");
      }
    }

    await ctx.db.delete(args.profileId);
    return { success: true };
  },
});

export const createClientProfile = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if profile already exists
    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();

    if (existingProfile) {
      return existingProfile;
    }

    // Create a basic client profile
    const profileId = await ctx.db.insert("userProfiles", {
      userId,
      firstName: "",
      lastName: "",
      role: "client",
      status: "pending",
    });

    return await ctx.db.get(profileId);
  },
});
