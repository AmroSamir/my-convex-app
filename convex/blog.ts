// Blog functionality has been completely removed from the platform
// This file contains minimal stub implementations to prevent build errors

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Stub implementations - these functions are disabled
export const createBlogPost = mutation({
  args: {
    title: v.string(),
    slug: v.string(),
    content: v.string(),
    excerpt: v.string(),
    featuredImage: v.optional(v.id("_storage")),
    tags: v.array(v.string()),
    status: v.union(v.literal("draft"), v.literal("published")),
  },
  handler: async (ctx, args) => {
    throw new Error("Blog functionality has been removed from this platform");
  },
});

export const updateBlogPost = mutation({
  args: {
    postId: v.string(),
    title: v.optional(v.string()),
    slug: v.optional(v.string()),
    content: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    featuredImage: v.optional(v.id("_storage")),
    tags: v.optional(v.array(v.string())),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"), v.literal("archived"))),
  },
  handler: async (ctx, args) => {
    throw new Error("Blog functionality has been removed from this platform");
  },
});

export const deleteBlogPost = mutation({
  args: {
    postId: v.string(),
  },
  handler: async (ctx, args) => {
    throw new Error("Blog functionality has been removed from this platform");
  },
});

export const searchBlogPosts = query({
  args: {
    query: v.string(),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"), v.literal("archived"))),
  },
  handler: async (ctx, args) => {
    return [];
  },
});
