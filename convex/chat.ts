import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get all conversations for current user
export const getMyConversations = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get all conversations where user is a participant
    const participations = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const conversations = await Promise.all(
      participations.map(async (participation) => {
        const conversation = await ctx.db.get(participation.conversationId);
        if (!conversation || !conversation.isActive) return null;

        // Get other participants
        const allParticipants = await ctx.db
          .query("conversationParticipants")
          .withIndex("by_conversation", (q) => q.eq("conversationId", conversation._id))
          .filter((q) => q.eq(q.field("isActive"), true))
          .collect();

        const participants = await Promise.all(
          allParticipants.map(async (p) => {
            const user = await ctx.db.get(p.userId);
            const profile = await ctx.db
              .query("userProfiles")
              .withIndex("by_user_id", (q) => q.eq("userId", p.userId))
              .first();
            
            return {
              userId: p.userId,
              role: p.role,
              name: profile ? `${profile.firstName} ${profile.lastName}` : user?.email || "Unknown",
              avatar: profile?.avatar,
              isOnline: profile?.isOnline || false,
              lastSeen: profile?.lastSeen,
            };
          })
        );

        // Get unread count
        const lastReadAt = participation.lastReadAt || 0;
        const unreadMessages = await ctx.db
          .query("messages")
          .withIndex("by_conversation", (q) => q.eq("conversationId", conversation._id))
          .filter((q) => 
            q.and(
              q.gt(q.field("_creationTime"), lastReadAt),
              q.neq(q.field("senderId"), userId),
              q.neq(q.field("isDeleted"), true)
            )
          )
          .collect();

        // For direct chats, get the other user's info
        let displayName = conversation.name;
        let displayAvatar = conversation.avatar;
        
        if (conversation.type === "direct") {
          const otherParticipant = participants.find(p => p.userId !== userId);
          if (otherParticipant) {
            displayName = otherParticipant.name;
            displayAvatar = otherParticipant.avatar;
          }
        }

        return {
          ...conversation,
          displayName,
          displayAvatar,
          participants,
          unreadCount: unreadMessages.length,
          lastReadAt: participation.lastReadAt,
        };
      })
    );

    return conversations
      .filter(Boolean)
      .sort((a, b) => (b!.lastMessageAt || 0) - (a!.lastMessageAt || 0));
  },
});

// Get messages for a conversation
export const getMessages = query({
  args: {
    conversationId: v.id("conversations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if user is participant
    const participation = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_conversation_user", (q) => 
        q.eq("conversationId", args.conversationId).eq("userId", userId)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!participation) {
      throw new Error("Not authorized to view this conversation");
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .order("desc")
      .take(args.limit || 50);

    const messagesWithSender = await Promise.all(
      messages.map(async (message) => {
        const sender = await ctx.db.get(message.senderId);
        const senderProfile = await ctx.db
          .query("userProfiles")
          .withIndex("by_user_id", (q) => q.eq("userId", message.senderId))
          .first();

        // Get file URL if message has a file
        let fileUrl = null;
        if (message.fileId) {
          fileUrl = await ctx.storage.getUrl(message.fileId);
        }

        // Get reply message if this is a reply
        let replyTo = null;
        if (message.replyToId) {
          const replyMessage = await ctx.db.get(message.replyToId);
          if (replyMessage && !replyMessage.isDeleted) {
            const replySender = await ctx.db.get(replyMessage.senderId);
            const replySenderProfile = await ctx.db
              .query("userProfiles")
              .withIndex("by_user_id", (q) => q.eq("userId", replyMessage.senderId))
              .first();
            
            replyTo = {
              ...replyMessage,
              senderName: replySenderProfile 
                ? `${replySenderProfile.firstName} ${replySenderProfile.lastName}`
                : replySender?.email || "Unknown",
            };
          }
        }

        // Get read receipts for this message
        const readReceipts = await ctx.db
          .query("messageReadReceipts")
          .withIndex("by_message", (q) => q.eq("messageId", message._id))
          .collect();

        return {
          ...message,
          senderName: senderProfile 
            ? `${senderProfile.firstName} ${senderProfile.lastName}`
            : sender?.email || "Unknown",
          senderAvatar: senderProfile?.avatar,
          fileUrl,
          replyTo,
          readReceipts,
        };
      })
    );

    return messagesWithSender.reverse(); // Return in chronological order
  },
});

// Create a direct conversation
export const createDirectConversation = mutation({
  args: {
    otherUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    if (userId === args.otherUserId) {
      throw new Error("Cannot create conversation with yourself");
    }

    // Check if conversation already exists
    const existingParticipations = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    for (const participation of existingParticipations) {
      const conversation = await ctx.db.get(participation.conversationId);
      if (conversation?.type === "direct") {
        const otherParticipation = await ctx.db
          .query("conversationParticipants")
          .withIndex("by_conversation", (q) => q.eq("conversationId", conversation._id))
          .filter((q) => 
            q.and(
              q.eq(q.field("isActive"), true),
              q.neq(q.field("userId"), userId)
            )
          )
          .first();
        
        if (otherParticipation?.userId === args.otherUserId) {
          return conversation._id; // Return existing conversation
        }
      }
    }

    // Create new conversation
    const conversationId = await ctx.db.insert("conversations", {
      type: "direct",
      createdBy: userId,
      isActive: true,
    });

    // Add participants
    await ctx.db.insert("conversationParticipants", {
      conversationId,
      userId,
      role: "member",
      joinedAt: Date.now(),
      isActive: true,
    });

    await ctx.db.insert("conversationParticipants", {
      conversationId,
      userId: args.otherUserId,
      role: "member",
      joinedAt: Date.now(),
      isActive: true,
    });

    return conversationId;
  },
});

// Create a group conversation
export const createGroupConversation = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    participantIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Create conversation
    const conversationId = await ctx.db.insert("conversations", {
      type: "group",
      name: args.name,
      description: args.description,
      createdBy: userId,
      isActive: true,
    });

    // Add creator as admin
    await ctx.db.insert("conversationParticipants", {
      conversationId,
      userId,
      role: "admin",
      joinedAt: Date.now(),
      isActive: true,
    });

    // Add other participants as members
    for (const participantId of args.participantIds) {
      if (participantId !== userId) {
        await ctx.db.insert("conversationParticipants", {
          conversationId,
          userId: participantId,
          role: "member",
          joinedAt: Date.now(),
          isActive: true,
        });
      }
    }

    // Send system message
    await ctx.db.insert("messages", {
      conversationId,
      senderId: userId,
      type: "system",
      content: `Group "${args.name}" was created`,
    });

    return conversationId;
  },
});

// Send a text message
export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
    replyToId: v.optional(v.id("messages")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if user is participant
    const participation = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_conversation_user", (q) => 
        q.eq("conversationId", args.conversationId).eq("userId", userId)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!participation) {
      throw new Error("Not authorized to send messages to this conversation");
    }

    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: userId,
      type: "text",
      content: args.content,
      replyToId: args.replyToId,
    });

    // Update conversation last message
    await ctx.db.patch(args.conversationId, {
      lastMessageAt: Date.now(),
      lastMessage: args.content.substring(0, 100),
    });

    return messageId;
  },
});

// Send a file message (image, voice, or file)
export const sendFileMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    fileId: v.id("_storage"),
    type: v.union(v.literal("image"), v.literal("voice"), v.literal("file")),
    fileName: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    duration: v.optional(v.number()), // For voice messages
    replyToId: v.optional(v.id("messages")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if user is participant
    const participation = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_conversation_user", (q) => 
        q.eq("conversationId", args.conversationId).eq("userId", userId)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!participation) {
      throw new Error("Not authorized to send messages to this conversation");
    }

    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: userId,
      type: args.type,
      fileId: args.fileId,
      fileName: args.fileName,
      fileSize: args.fileSize,
      duration: args.duration,
      replyToId: args.replyToId,
    });

    // Update conversation last message
    const lastMessageText = 
      args.type === "image" ? "📷 Image" :
      args.type === "voice" ? "🎤 Voice message" :
      `📎 ${args.fileName || "File"}`;

    await ctx.db.patch(args.conversationId, {
      lastMessageAt: Date.now(),
      lastMessage: lastMessageText,
    });

    return messageId;
  },
});

// Mark messages as read
export const markMessagesAsRead = mutation({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const now = Date.now();

    // Update participant's last read time
    const participation = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_conversation_user", (q) => 
        q.eq("conversationId", args.conversationId).eq("userId", userId)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (participation) {
      await ctx.db.patch(participation._id, {
        lastReadAt: now,
      });
    }

    // Get unread messages
    const lastReadAt = participation?.lastReadAt || 0;
    const unreadMessages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .filter((q) => 
        q.and(
          q.gt(q.field("_creationTime"), lastReadAt),
          q.neq(q.field("senderId"), userId),
          q.neq(q.field("isDeleted"), true)
        )
      )
      .collect();

    // Create read receipts
    for (const message of unreadMessages) {
      const existingReceipt = await ctx.db
        .query("messageReadReceipts")
        .withIndex("by_message_user", (q) => 
          q.eq("messageId", message._id).eq("userId", userId)
        )
        .first();

      if (!existingReceipt) {
        await ctx.db.insert("messageReadReceipts", {
          messageId: message._id,
          userId,
          readAt: now,
        });
      }
    }

    return { markedAsRead: unreadMessages.length };
  },
});

// Generate upload URL for files
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Delete a message
export const deleteMessage = mutation({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");

    if (message.senderId !== userId) {
      throw new Error("Can only delete your own messages");
    }

    await ctx.db.patch(args.messageId, {
      isDeleted: true,
      deletedAt: Date.now(),
    });

    return { success: true };
  },
});

// Edit a message
export const editMessage = mutation({
  args: {
    messageId: v.id("messages"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");

    if (message.senderId !== userId) {
      throw new Error("Can only edit your own messages");
    }

    if (message.type !== "text") {
      throw new Error("Can only edit text messages");
    }

    await ctx.db.patch(args.messageId, {
      content: args.content,
      isEdited: true,
      editedAt: Date.now(),
    });

    return { success: true };
  },
});

// Get users for creating conversations
export const getUsers = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const users = await ctx.db.query("users").collect();
    const profiles = await ctx.db.query("userProfiles").collect();

    return users
      .filter(user => user._id !== userId)
      .map(user => {
        const profile = profiles.find(p => p.userId === user._id);
        return {
          _id: user._id,
          email: user.email,
          name: profile ? `${profile.firstName} ${profile.lastName}` : user.email,
          avatar: profile?.avatar,
          isOnline: profile?.isOnline || false,
          lastSeen: profile?.lastSeen,
        };
      })
      .filter(user => user.name !== user.email); // Only show users with profiles
  },
});

// Update user online status
export const updateOnlineStatus = mutation({
  args: {
    isOnline: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();

    if (profile) {
      await ctx.db.patch(profile._id, {
        isOnline: args.isOnline,
        lastSeen: Date.now(),
      });
    }

    return { success: true };
  },
});
