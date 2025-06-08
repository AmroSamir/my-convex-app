import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

// Generate activation token
export const generateActivationToken = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // Generate a secure random token
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours

    // Store the activation token
    await ctx.db.insert("activationTokens", {
      email: args.email,
      token,
      expiresAt,
      used: false,
    });

    return { token, expiresAt };
  },
});

// Verify activation token
export const verifyActivationToken = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const tokenRecord = await ctx.db
      .query("activationTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!tokenRecord) {
      throw new Error("Invalid activation token");
    }

    if (tokenRecord.used) {
      throw new Error("Activation token has already been used");
    }

    if (tokenRecord.expiresAt < Date.now()) {
      throw new Error("Activation token has expired");
    }

    // Find the user by email
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", tokenRecord.email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Activate the user
    await ctx.db.patch(user._id, {
      emailVerificationTime: Date.now(),
    });

    // Update user profile status
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .first();

    if (profile && profile.status === "pending") {
      await ctx.db.patch(profile._id, {
        status: "active",
      });
    }

    // Mark token as used
    await ctx.db.patch(tokenRecord._id, {
      used: true,
    });

    return { success: true, email: tokenRecord.email };
  },
});

// Send activation email
export const sendActivationEmail = action({
  args: {
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Generate activation token
    const { token } = await ctx.runMutation(api.emailActivation.generateActivationToken, {
      email: args.email,
    });

    // Create activation URL
    const activationUrl = `https://eyeshots.co/activate?token=${token}`;

    // Send email using Resend
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.CONVEX_RESEND_API_KEY);

    const userName = args.firstName && args.lastName 
      ? `${args.firstName} ${args.lastName}` 
      : args.email;

    const { data, error } = await resend.emails.send({
      from: "Eye Shots <noreply@eyeshots.co>",
      to: args.email,
      subject: "Activate Your Eye Shots Account",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Activate Your Eye Shots Account</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="https://eyeshots.co/wp-content/uploads/2025/05/eye-shots-horizontal-colored-logo-scaled.png" alt="Eye Shots" style="max-width: 200px; height: auto;">
          </div>
          
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Eye Shots!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Your premium platform experience awaits</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="color: #333; margin-top: 0;">Hello ${userName},</h2>
            <p style="margin-bottom: 20px;">Thank you for joining Eye Shots! To complete your registration and access your premium platform experience, please activate your account by clicking the button below.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${activationUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">Activate My Account</a>
            </div>
            
            <p style="margin-top: 20px; font-size: 14px; color: #666;">If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #e9ecef; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 12px;">${activationUrl}</p>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin-bottom: 25px;">
            <p style="margin: 0; color: #856404; font-size: 14px;"><strong>Important:</strong> This activation link will expire in 24 hours. If you don't activate your account within this time, you'll need to request a new activation email.</p>
          </div>
          
          <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #666; font-size: 12px;">
            <p>This email was sent to ${args.email}. If you didn't create an account with Eye Shots, please ignore this email.</p>
            <p style="margin-top: 15px;">
              <strong>Eye Shots</strong><br>
              Premium Platform Experience<br>
              <a href="https://eyeshots.co" style="color: #667eea;">eyeshots.co</a>
            </p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      throw new Error(`Failed to send activation email: ${JSON.stringify(error)}`);
    }

    return { success: true, messageId: data?.id };
  },
});

// Resend activation email
export const resendActivationEmail = action({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; messageId?: string }> => {
    // Find user by email
    const user: any = await ctx.runQuery(api.emailActivation.getUserByEmail, {
      email: args.email,
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (user.emailVerificationTime) {
      throw new Error("Account is already activated");
    }

    // Invalidate existing tokens for this email
    await ctx.runMutation(api.emailActivation.invalidateTokensForEmail, {
      email: args.email,
    });

    // Send new activation email
    return await ctx.runAction(api.emailActivation.sendActivationEmail, {
      email: args.email,
      firstName: user.profile?.firstName,
      lastName: user.profile?.lastName,
    });
  },
});

// Helper queries
export const getUserByEmail = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      return null;
    }

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .first();

    return {
      _id: user._id,
      email: user.email,
      emailVerificationTime: user.emailVerificationTime,
      profile,
    };
  },
});

export const invalidateTokensForEmail = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const tokens = await ctx.db
      .query("activationTokens")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .filter((q) => q.eq(q.field("used"), false))
      .collect();

    for (const token of tokens) {
      await ctx.db.patch(token._id, { used: true });
    }

    return { invalidated: tokens.length };
  },
});

// Check if user needs activation
export const needsActivation = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return false;
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      return false;
    }

    // User needs activation if they don't have emailVerificationTime
    return !user.emailVerificationTime;
  },
});
