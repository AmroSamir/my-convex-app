import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get current onboarding status
export const getOnboardingStatus = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();

    // Only clients need onboarding
    if (!userProfile || userProfile.role !== "client") {
      return null;
    }

    const onboarding = await ctx.db
      .query("clientOnboarding")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return onboarding;
  },
});

// Start onboarding process
export const startOnboarding = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();

    if (!userProfile || userProfile.role !== "client") {
      throw new Error("Only clients can start onboarding");
    }

    // Check if onboarding already exists
    const existing = await ctx.db
      .query("clientOnboarding")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      return existing._id;
    }

    const onboardingId = await ctx.db.insert("clientOnboarding", {
      userId,
      currentStep: 1,
      totalSteps: 6,
      isCompleted: false,
      startedAt: Date.now(),
    });

    return onboardingId;
  },
});

// Update onboarding step
export const updateOnboardingStep = mutation({
  args: {
    step: v.number(),
    data: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const onboarding = await ctx.db
      .query("clientOnboarding")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!onboarding) {
      throw new Error("Onboarding not found");
    }

    const updates: any = {
      currentStep: args.step,
    };

    // Store data based on step
    switch (args.step) {
      case 1:
        updates.companyName = args.data;
        break;
      case 2:
        updates.businessProfile = args.data;
        break;
      case 3:
        updates.currentMarketing = args.data;
        break;
      case 4:
        updates.goals = args.data;
        break;
      case 5:
        updates.servicePreferences = args.data;
        break;
      case 6:
        updates.finalSetup = args.data;
        updates.isCompleted = true;
        updates.completedAt = Date.now();
        break;
    }

    await ctx.db.patch(onboarding._id, updates);

    // Generate recommendations if onboarding is completed
    if (args.step === 6) {
      await generateRecommendations(ctx, userId, onboarding._id);
    }

    return onboarding._id;
  },
});

// Generate service recommendations
async function generateRecommendations(ctx: any, userId: string, onboardingId: string) {
  const onboarding = await ctx.db.get(onboardingId);
  if (!onboarding) return;

  // Parse the stored data
  let businessProfile, currentMarketing, goals, servicePreferences;
  
  try {
    businessProfile = onboarding.businessProfile ? JSON.parse(onboarding.businessProfile) : {};
    currentMarketing = onboarding.currentMarketing ? JSON.parse(onboarding.currentMarketing) : {};
    goals = onboarding.goals ? JSON.parse(onboarding.goals) : {};
    servicePreferences = onboarding.servicePreferences ? JSON.parse(onboarding.servicePreferences) : {};
  } catch (e) {
    // Handle parsing errors gracefully
    businessProfile = {};
    currentMarketing = {};
    goals = {};
    servicePreferences = {};
  }

  // Generate recommendations based on collected data
  const recommendations = generateServiceRecommendations(
    businessProfile,
    currentMarketing,
    goals,
    servicePreferences
  );

  const strategy = generateCustomStrategy(
    onboarding.companyName || "Your Business",
    businessProfile,
    currentMarketing,
    goals
  );

  await ctx.db.insert("serviceRecommendations", {
    userId,
    onboardingId,
    recommendations: JSON.stringify(recommendations),
    customStrategy: JSON.stringify(strategy),
    generatedAt: Date.now(),
  });
}

function generateServiceRecommendations(businessProfile: any, currentMarketing: any, goals: any, servicePreferences: any) {
  const services = [];

  // SEO recommendations based on business type and goals
  if (goals.primaryGoals?.includes("Increase online visibility") || 
      !currentMarketing.currentChannels?.includes("SEO") ||
      businessProfile.businessType === "ecommerce" ||
      businessProfile.businessType === "saas") {
    services.push({
      serviceId: "seo",
      serviceName: "Search Engine Optimization",
      priority: "high",
      reasoning: getBusinessTypeReasoning(businessProfile.businessType, "seo"),
      estimatedCost: "$1,500-3,000/month",
      timeline: "3-6 months for results"
    });
  }

  // Social Media Marketing based on business type
  if (goals.primaryGoals?.includes("Boost brand awareness") || 
      goals.primaryGoals?.includes("Generate more leads") ||
      businessProfile.businessType === "small_business" ||
      businessProfile.businessType === "ecommerce") {
    services.push({
      serviceId: "social_media",
      serviceName: "Social Media Marketing",
      priority: "high",
      reasoning: getBusinessTypeReasoning(businessProfile.businessType, "social_media"),
      estimatedCost: "$1,000-2,500/month",
      timeline: "1-3 months for engagement growth"
    });
  }

  // PPC Advertising for immediate results
  if (goals.primaryGoals?.includes("Generate more leads") || 
      currentMarketing.monthlyBudget === "$5,000-10,000" ||
      currentMarketing.monthlyBudget === "$10,000+" ||
      goals.timeline === "Immediate (1-3 months)") {
    services.push({
      serviceId: "ppc",
      serviceName: "Pay-Per-Click Advertising",
      priority: "medium",
      reasoning: "Quick results for lead generation and immediate visibility",
      estimatedCost: "$2,000-5,000/month",
      timeline: "1-2 weeks for campaign launch"
    });
  }

  // Content Marketing for SaaS and tech companies
  if (businessProfile.businessType === "saas" || 
      businessProfile.businessType === "startup" ||
      goals.primaryGoals?.includes("Build thought leadership")) {
    services.push({
      serviceId: "content_marketing",
      serviceName: "Content Marketing",
      priority: "medium",
      reasoning: getBusinessTypeReasoning(businessProfile.businessType, "content_marketing"),
      estimatedCost: "$1,200-2,000/month",
      timeline: "2-4 months for content library"
    });
  }

  // Email Marketing for customer retention
  if (goals.primaryGoals?.includes("Improve customer retention") ||
      businessProfile.businessType === "ecommerce" ||
      businessProfile.companySize === "growing" ||
      businessProfile.companySize === "established") {
    services.push({
      serviceId: "email_marketing",
      serviceName: "Email Marketing",
      priority: "medium",
      reasoning: "Excellent ROI for customer retention and nurturing",
      estimatedCost: "$500-1,500/month",
      timeline: "2-4 weeks for setup"
    });
  }

  // Website Development for new businesses
  if (businessProfile.yearsInBusiness === "just_starting" ||
      businessProfile.yearsInBusiness === "early_stage" ||
      !currentMarketing.currentChannels?.includes("Website")) {
    services.push({
      serviceId: "website_development",
      serviceName: "Website Design/Development",
      priority: "high",
      reasoning: "Essential foundation for all digital marketing efforts",
      estimatedCost: "$3,000-8,000 one-time",
      timeline: "4-8 weeks for completion"
    });
  }

  return services;
}

function getBusinessTypeReasoning(businessType: string, service: string): string {
  const reasoningMap: Record<string, Record<string, string>> = {
    small_business: {
      seo: "Local SEO is crucial for small businesses to be found by nearby customers",
      social_media: "Perfect for building community and local brand awareness",
      content_marketing: "Helps establish expertise and trust in your local market"
    },
    ecommerce: {
      seo: "Essential for product discovery and organic traffic to your online store",
      social_media: "Drives traffic and showcases products to potential customers",
      content_marketing: "Product guides and reviews boost SEO and customer confidence"
    },
    saas: {
      seo: "Critical for B2B software discovery and thought leadership",
      social_media: "LinkedIn and Twitter are key for B2B lead generation",
      content_marketing: "Educational content drives qualified leads and establishes authority"
    },
    mobile_app: {
      seo: "App Store Optimization (ASO) and web presence for app discovery",
      social_media: "Essential for app promotion and user engagement",
      content_marketing: "Tutorials and feature highlights drive app downloads"
    },
    fintech: {
      seo: "Trust and authority are crucial in financial services",
      social_media: "Educational content builds trust and compliance awareness",
      content_marketing: "Regulatory compliance and educational content is essential"
    },
    startup: {
      seo: "Early SEO foundation sets up long-term organic growth",
      social_media: "Cost-effective way to build initial brand awareness",
      content_marketing: "Thought leadership content attracts investors and customers"
    }
  };

  return reasoningMap[businessType]?.[service] || "Recommended based on your business profile and goals";
}

function generateCustomStrategy(companyName: string, businessProfile: any, currentMarketing: any, goals: any) {
  const businessTypeStrategies: Record<string, any> = {
    small_business: {
      focus: "local visibility and community engagement",
      keyChannels: ["Local SEO", "Google My Business", "Social Media", "Local Partnerships"],
      timeline: "3-6 months for local market dominance"
    },
    ecommerce: {
      focus: "product visibility and conversion optimization",
      keyChannels: ["SEO", "PPC", "Social Commerce", "Email Marketing"],
      timeline: "2-4 months for traffic and sales growth"
    },
    saas: {
      focus: "lead generation and thought leadership",
      keyChannels: ["Content Marketing", "LinkedIn", "SEO", "Webinars"],
      timeline: "4-8 months for qualified lead pipeline"
    },
    mobile_app: {
      focus: "app downloads and user engagement",
      keyChannels: ["App Store Optimization", "Social Media", "Influencer Marketing"],
      timeline: "2-6 months for user acquisition"
    },
    fintech: {
      focus: "trust building and compliance-aware marketing",
      keyChannels: ["Educational Content", "LinkedIn", "Webinars", "PR"],
      timeline: "6-12 months for trust and authority building"
    },
    startup: {
      focus: "rapid growth and market validation",
      keyChannels: ["Content Marketing", "Social Media", "PR", "Community Building"],
      timeline: "3-9 months for market traction"
    }
  };

  const strategy = businessTypeStrategies[businessProfile.businessType] || businessTypeStrategies.startup;

  return {
    overview: `Based on ${companyName}'s profile as a ${businessProfile.businessType} business, we recommend a focused approach on ${strategy.focus}.`,
    keyRecommendations: [
      `Prioritize ${strategy.keyChannels[0]} as your primary growth channel`,
      `Implement ${strategy.keyChannels[1]} for immediate visibility`,
      `Set up comprehensive analytics and tracking`,
      `Create a content calendar aligned with your business goals`
    ],
    nextSteps: [
      "Schedule strategy consultation call",
      "Conduct comprehensive business audit",
      "Develop 90-day action plan",
      "Set up tracking and reporting systems"
    ],
    expectedOutcomes: [
      `${strategy.timeline} for measurable results`,
      "Improved brand visibility in your target market",
      "Higher quality lead generation",
      "Better ROI on marketing investments"
    ],
    businessTypeInsights: {
      type: businessProfile.businessType,
      size: businessProfile.companySize,
      maturity: businessProfile.yearsInBusiness,
      customRecommendations: getBusinessTypeSpecificRecommendations(businessProfile)
    }
  };
}

function getBusinessTypeSpecificRecommendations(businessProfile: any): string[] {
  const recommendations: Record<string, string[]> = {
    small_business: [
      "Focus on local SEO and Google My Business optimization",
      "Build relationships with local community and businesses",
      "Use social media to showcase your local expertise"
    ],
    ecommerce: [
      "Optimize product pages for search engines",
      "Implement abandoned cart email sequences",
      "Use social proof and customer reviews strategically"
    ],
    saas: [
      "Create educational content that solves customer problems",
      "Implement free trial or freemium model marketing",
      "Focus on customer success and retention metrics"
    ],
    mobile_app: [
      "Optimize app store listings with relevant keywords",
      "Create engaging social media content showcasing app features",
      "Implement user-generated content campaigns"
    ],
    fintech: [
      "Ensure all marketing complies with financial regulations",
      "Focus on educational content to build trust",
      "Highlight security and compliance certifications"
    ],
    startup: [
      "Build thought leadership through content and speaking",
      "Focus on product-market fit validation through marketing",
      "Leverage founder's personal brand for company growth"
    ]
  };

  return recommendations[businessProfile.businessType] || recommendations.startup;
}

// Get recommendations
export const getRecommendations = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const recommendations = await ctx.db
      .query("serviceRecommendations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .first();

    if (!recommendations) return null;

    return {
      ...recommendations,
      recommendations: JSON.parse(recommendations.recommendations),
      customStrategy: JSON.parse(recommendations.customStrategy),
    };
  },
});

export const resetOnboarding = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existingOnboarding = await ctx.db
      .query("clientOnboarding")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existingOnboarding) {
      await ctx.db.delete(existingOnboarding._id);
    }

    const existingRecommendations = await ctx.db
      .query("serviceRecommendations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const rec of existingRecommendations) {
      await ctx.db.delete(rec._id);
    }

    return "Onboarding reset successfully";
  },
});
