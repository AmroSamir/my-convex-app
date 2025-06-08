// Menu functionality has been completely removed from the platform
// This file contains minimal stub implementations to prevent build errors

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Stub implementations - these functions are disabled
export const getMenuItems = query({
  args: {},
  handler: async (ctx) => {
    return [];
  },
});

export const getVisibleMenuItems = query({
  args: {},
  handler: async (ctx) => {
    return [];
  },
});

export const createMenuItem = mutation({
  args: {
    label: v.string(),
    url: v.string(),
    order: v.number(),
    isVisible: v.boolean(),
    parentId: v.optional(v.string()),
    icon: v.optional(v.string()),
    requiredRole: v.optional(v.union(v.literal("admin"), v.literal("employee"), v.literal("client"))),
  },
  handler: async (ctx, args) => {
    throw new Error("Menu functionality has been removed from this platform");
  },
});

export const updateMenuItem = mutation({
  args: {
    menuItemId: v.string(),
    label: v.optional(v.string()),
    url: v.optional(v.string()),
    order: v.optional(v.number()),
    isVisible: v.optional(v.boolean()),
    parentId: v.optional(v.string()),
    icon: v.optional(v.string()),
    requiredRole: v.optional(v.union(v.literal("admin"), v.literal("employee"), v.literal("client"))),
  },
  handler: async (ctx, args) => {
    throw new Error("Menu functionality has been removed from this platform");
  },
});

export const deleteMenuItem = mutation({
  args: {
    menuItemId: v.string(),
  },
  handler: async (ctx, args) => {
    throw new Error("Menu functionality has been removed from this platform");
  },
});

export const reorderMenuItems = mutation({
  args: {
    items: v.array(v.object({
      id: v.string(),
      order: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    throw new Error("Menu functionality has been removed from this platform");
  },
});
