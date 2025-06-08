import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

import { Sidebar } from "./Sidebar";
import { MainContent } from "./MainContent";
import { OnboardingFlow } from "./onboarding/OnboardingFlow";

export function Dashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const user = useQuery(api.users.getCurrentUser);
  const onboardingStatus = useQuery(api.onboarding.getOnboardingStatus);

  // Show loading state
  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  // If user doesn't have a profile, show a simple message
  if (!user?.profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-user text-white text-2xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Setting up your profile...</h2>
          <p className="text-gray-600 mb-4">
            We're preparing your account. This should only take a moment.
          </p>
          <div className="animate-pulse bg-gray-200 h-2 rounded-full"></div>
        </div>
      </div>
    );
  }

  // Show onboarding for clients who haven't completed it
  if (user.profile.role === "client" && (!onboardingStatus || !onboardingStatus.completedAt)) {
    return <OnboardingFlow user={user} />;
  }

  // Show main dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <Sidebar 
          user={user}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />
        <MainContent 
          user={user}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />
      </div>
    </div>
  );
}
