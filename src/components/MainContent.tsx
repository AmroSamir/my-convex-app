import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { AdminUserControl } from "./admin/AdminUserControl";
import { TaskManagement } from "./tasks/TaskManagement";
import { ChatInterface } from "./chat/ChatInterface";
import { OnboardingFlow } from "./onboarding/OnboardingFlow";
import { RecommendationsDashboard } from "./onboarding/RecommendationsDashboard";
import { toast } from "sonner";

interface MainContentProps {
  user: any;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed?: boolean;
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

export function MainContent({ 
  user, 
  activeTab, 
  setActiveTab,
  collapsed = false,
  mobileOpen,
  setMobileOpen
}: MainContentProps) {
  // Get the current active role (either switched role or default role)
  const currentRole = user.profile.currentActiveRole || user.profile.role;
  const isAdmin = currentRole === "admin";
  const isEmployee = currentRole === "employee";
  const isClient = currentRole === "client";

  // Check if client needs onboarding
  const onboardingStatus = useQuery(api.onboarding.getOnboardingStatus);
  const recommendations = useQuery(api.onboarding.getRecommendations);

  // Show onboarding flow for clients who haven't completed it
  if (isClient && onboardingStatus !== null && !onboardingStatus?.isCompleted) {
    return <OnboardingFlow user={user} onComplete={() => setActiveTab("overview")} />;
  }

  // Show recommendations dashboard for clients who completed onboarding
  if (isClient && activeTab === "overview" && recommendations) {
    return <RecommendationsDashboard user={user} />;
  }

  return (
    <div className={`flex-1 transition-all duration-300 ${collapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
      {/* Mobile Header Bar */}
      <div className="lg:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <button
          onClick={() => setMobileOpen && setMobileOpen(!mobileOpen)}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <i className="fas fa-bars text-lg"></i>
        </button>
        <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">
          Eye Shots
        </h1>
        <div className="w-10"></div> {/* Spacer for centering */}
      </div>

      <main className="p-4 lg:p-6 min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {activeTab === "overview" && <OverviewContent user={user} currentRole={currentRole} />}
          {activeTab === "projects" && <ProjectsContent />}
          {activeTab === "tasks" && (isAdmin || isEmployee) && <TaskManagement />}
          {activeTab === "messages" && <MessagesContent user={user} />}
          {activeTab === "onboarding" && isClient && <OnboardingContent user={user} />}
          {activeTab === "users" && isAdmin && <AdminUserControl />}
          {activeTab === "settings" && <SettingsContent />}
        </div>
      </main>
    </div>
  );
}

function OverviewContent({ user, currentRole }: { user: any; currentRole: string }) {
  const taskStats = useQuery(api.tasks.getTaskStats);
  const myTasks = useQuery(api.tasks.getMyTasks, { status: "pending" });
  const notifications = useQuery(api.notifications.getMyNotifications, { limit: 5, unreadOnly: true });
  const createTestNotification = useMutation(api.notifications.createTestNotification);

  const handleCreateTestNotification = async () => {
    try {
      await createTestNotification();
      toast.success("Test notification created!");
    } catch (error: any) {
      toast.error(error.message || "Failed to create test notification");
    }
  };

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
        <p className="text-gray-600">Get an overview of your platform activity</p>
      </div>

      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 rounded-xl lg:rounded-2xl p-6 lg:p-8 text-white">
        <div className="max-w-4xl">
          <h2 className="text-2xl lg:text-3xl font-bold mb-4">
            Welcome back, {user.profile.firstName}!
          </h2>
          <p className="text-base lg:text-lg opacity-90">
            {currentRole === "admin" && "Manage your platform with full administrative control."}
            {currentRole === "employee" && "Access your tasks and manage your workload."}
            {currentRole === "client" && "Welcome to your premium experience."}
          </p>
          {user.profile.canSwitchRoles && user.profile.availableRoles && user.profile.availableRoles.length > 1 && (
            <div className="mt-4 flex items-center space-x-2 text-sm opacity-80">
              <i className="fas fa-info-circle"></i>
              <span>
                You're currently in <strong className="capitalize">{currentRole}</strong> mode. 
                Switch roles from the sidebar to access different features.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {taskStats && (
          <>
            <div className="bg-white rounded-lg lg:rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm font-medium text-gray-600">Total Tasks</p>
                  <p className="text-2xl lg:text-3xl font-bold text-gray-900">{taskStats.total}</p>
                </div>
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-tasks text-blue-600 text-sm lg:text-base"></i>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg lg:rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl lg:text-3xl font-bold text-orange-600">{taskStats.pending}</p>
                </div>
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-clock text-orange-600 text-sm lg:text-base"></i>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg lg:rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-2xl lg:text-3xl font-bold text-yellow-600">{taskStats.inProgress}</p>
                </div>
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-spinner text-yellow-600 text-sm lg:text-base"></i>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg lg:rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl lg:text-3xl font-bold text-green-600">{taskStats.completed}</p>
                </div>
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-check-circle text-green-600 text-sm lg:text-base"></i>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Recent Tasks */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Tasks</h3>
            {taskStats && taskStats.pending > 0 && (
              <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {taskStats.pending} pending
              </span>
            )}
          </div>
          <div className="space-y-4">
            {myTasks?.slice(0, 5).map((task) => (
              <div key={task._id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  task.priority === "urgent" ? "bg-red-500" :
                  task.priority === "high" ? "bg-orange-500" :
                  task.priority === "medium" ? "bg-yellow-500" : "bg-green-500"
                }`}></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {task.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
                    task.priority === "urgent" ? "bg-red-100 text-red-800" :
                    task.priority === "high" ? "bg-orange-100 text-orange-800" :
                    task.priority === "medium" ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"
                  }`}>
                    {task.priority}
                  </span>
                </div>
              </div>
            ))}
            {(!myTasks || myTasks.length === 0) && (
              <div className="text-center py-8">
                <i className="fas fa-check-circle text-green-500 text-3xl mb-3"></i>
                <p className="text-sm text-gray-500">No pending tasks</p>
                <p className="text-xs text-gray-400">Great job staying on top of things!</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Notifications */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Notifications</h3>
            <button
              onClick={handleCreateTestNotification}
              className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors"
            >
              Test Notification
            </button>
          </div>
          <div className="space-y-4">
            {notifications?.slice(0, 5).map((notification) => (
              <div key={notification._id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  notification.type === "task" ? "bg-blue-500" :
                  notification.type === "system" ? "bg-green-500" : "bg-orange-500"
                }`}></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {notification.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(notification._creationTime).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
            {(!notifications || notifications.length === 0) && (
              <div className="text-center py-8">
                <i className="fas fa-bell-slash text-gray-400 text-3xl mb-3"></i>
                <p className="text-sm text-gray-500">No recent notifications</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjectsContent() {
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Projects</h1>
        <p className="text-gray-600">Manage your projects and collaborations</p>
      </div>
      
      <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-folder-open text-purple-600 text-2xl"></i>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Projects Coming Soon</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Project management features are being developed. You'll be able to create, manage, and collaborate on projects here.
          </p>
        </div>
      </div>
    </div>
  );
}

function MessagesContent({ user }: { user: any }) {
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Messages</h1>
        <p className="text-gray-600">Chat with your team members</p>
      </div>
      
      <div className="h-[calc(100vh-16rem)]">
        <ChatInterface user={user} />
      </div>
    </div>
  );
}

function OnboardingContent({ user }: { user: any }) {
  const onboardingStatus = useQuery(api.onboarding.getOnboardingStatus);
  const recommendations = useQuery(api.onboarding.getRecommendations);

  if (!onboardingStatus?.isCompleted) {
    return <OnboardingFlow user={user} />;
  }

  if (recommendations) {
    return <RecommendationsDashboard user={user} />;
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">My Marketing Strategy</h1>
        <p className="text-gray-600">View your personalized marketing strategy</p>
      </div>
      
      <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-chart-pie text-purple-600 text-2xl"></i>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Your Strategy</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            We're preparing your personalized marketing recommendations...
          </p>
        </div>
      </div>
    </div>
  );
}

function SettingsContent() {
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Configure your platform settings</p>
      </div>
      
      <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-cog text-gray-600 text-2xl"></i>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Settings</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Platform settings and configuration options will be available here.
          </p>
        </div>
      </div>
    </div>
  );
}
