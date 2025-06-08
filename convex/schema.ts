import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  // User profiles with roles and status
  userProfiles: defineTable({
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("employee"), v.literal("client")),
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("pending")),
    firstName: v.string(),
    lastName: v.string(),
    department: v.optional(v.string()),
    phone: v.optional(v.string()),
    avatar: v.optional(v.id("_storage")),
    lastLogin: v.optional(v.number()),
    createdBy: v.optional(v.id("users")),
    // Multi-role admin features
    availableRoles: v.optional(v.array(v.union(v.literal("admin"), v.literal("employee"), v.literal("client")))),
    currentActiveRole: v.optional(v.union(v.literal("admin"), v.literal("employee"), v.literal("client"))),
    canSwitchRoles: v.optional(v.boolean()),
    // Chat status
    isOnline: v.optional(v.boolean()),
    lastSeen: v.optional(v.number()),
  })
    .index("by_user_id", ["userId"])
    .index("by_role", ["role"])
    .index("by_status", ["status"]),

  // Tasks for employee management
  tasks: defineTable({
    title: v.string(),
    description: v.string(),
    assignedTo: v.id("users"),
    assignedBy: v.id("users"),
    status: v.union(v.literal("pending"), v.literal("in_progress"), v.literal("completed"), v.literal("overdue")),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
    dueDate: v.number(),
    completedAt: v.optional(v.number()),
    tags: v.array(v.string()),
  })
    .index("by_assigned_to", ["assignedTo"])
    .index("by_assigned_by", ["assignedBy"])
    .index("by_status", ["status"])
    .index("by_due_date", ["dueDate"]),

  // Notifications for users
  notifications: defineTable({
    userId: v.id("users"),
    title: v.string(),
    message: v.string(),
    type: v.union(v.literal("task"), v.literal("system"), v.literal("reminder")),
    isRead: v.boolean(),
    relatedEntityId: v.optional(v.string()),
    relatedEntityType: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_user_read", ["userId", "isRead"]),

  // Chat conversations (both direct and group chats)
  conversations: defineTable({
    type: v.union(v.literal("direct"), v.literal("group")),
    name: v.optional(v.string()), // For group chats
    description: v.optional(v.string()), // For group chats
    avatar: v.optional(v.id("_storage")), // Group avatar
    createdBy: v.id("users"),
    isActive: v.boolean(),
    lastMessageAt: v.optional(v.number()),
    lastMessage: v.optional(v.string()),
  })
    .index("by_created_by", ["createdBy"])
    .index("by_type", ["type"])
    .index("by_last_message", ["lastMessageAt"]),

  // Conversation participants
  conversationParticipants: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("member")), // For group chats
    joinedAt: v.number(),
    leftAt: v.optional(v.number()),
    isActive: v.boolean(),
    lastReadAt: v.optional(v.number()),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_user", ["userId"])
    .index("by_conversation_user", ["conversationId", "userId"]),

  // Chat messages
  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    type: v.union(
      v.literal("text"), 
      v.literal("image"), 
      v.literal("voice"), 
      v.literal("file"),
      v.literal("system") // For system messages like user joined/left
    ),
    content: v.optional(v.string()), // Text content
    fileId: v.optional(v.id("_storage")), // For images, voice, files
    fileName: v.optional(v.string()), // Original file name
    fileSize: v.optional(v.number()), // File size in bytes
    duration: v.optional(v.number()), // Voice message duration in seconds
    replyToId: v.optional(v.id("messages")), // For replies
    isEdited: v.optional(v.boolean()),
    editedAt: v.optional(v.number()),
    isDeleted: v.optional(v.boolean()),
    deletedAt: v.optional(v.number()),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_sender", ["senderId"]),

  // Message read receipts
  messageReadReceipts: defineTable({
    messageId: v.id("messages"),
    userId: v.id("users"),
    readAt: v.number(),
  })
    .index("by_message", ["messageId"])
    .index("by_user", ["userId"])
    .index("by_message_user", ["messageId", "userId"]),

  // Client onboarding flow
  clientOnboarding: defineTable({
    userId: v.id("users"),
    currentStep: v.number(),
    totalSteps: v.number(),
    isCompleted: v.boolean(),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    companyName: v.optional(v.string()),
    contactInfo: v.optional(v.string()),
    businessInfo: v.optional(v.string()),
    currentMarketing: v.optional(v.string()),
    goals: v.optional(v.string()),
    servicePreferences: v.optional(v.string()),
    finalSetup: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_completion", ["isCompleted"]),

  // Service recommendations
  serviceRecommendations: defineTable({
    userId: v.id("users"),
    onboardingId: v.id("clientOnboarding"),
    recommendations: v.string(),
    customStrategy: v.string(),
    generatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_onboarding", ["onboardingId"]),

  // Email activation tokens
  activationTokens: defineTable({
    email: v.string(),
    token: v.string(),
    expiresAt: v.number(),
    used: v.boolean(),
  })
    .index("by_email", ["email"])
    .index("by_token", ["token"]),

  // Audit logs for all actions
  auditLogs: defineTable({
    userId: v.id("users"),
    action: v.string(),
    entityType: v.string(),
    entityId: v.string(),
    details: v.object({
      before: v.optional(v.any()),
      after: v.optional(v.any()),
      metadata: v.optional(v.any()),
    }),
    ipAddress: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_entity", ["entityType", "entityId"])
    .index("by_action", ["action"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
