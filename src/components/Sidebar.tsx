import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { SignOutButton } from "../SignOutButton";
import { toast } from "sonner";
import { useState, useRef, useEffect } from "react";

interface SidebarProps {
  user: any;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export function Sidebar({ 
  user, 
  activeTab, 
  setActiveTab, 
  collapsed, 
  setCollapsed, 
  mobileOpen, 
  setMobileOpen 
}: SidebarProps) {
  const switchRole = useMutation(api.users.switchRole);
  const unreadCount = useQuery(api.notifications.getUnreadCount);
  const resetOnboarding = useMutation(api.onboarding.resetOnboarding);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Get the current active role (either switched role or default role)
  const currentRole = user.profile.currentActiveRole || user.profile.role;
  const isAdmin = currentRole === "admin";
  const isEmployee = currentRole === "employee";

  const menuItems = [
    { 
      id: "overview", 
      label: "Overview", 
      icon: "fa-chart-line", 
      roles: ["admin", "employee", "client"] 
    },
    { 
      id: "projects", 
      label: "Projects", 
      icon: "fa-folder-open", 
      roles: ["admin", "employee", "client"] 
    },
    { 
      id: "tasks", 
      label: "Tasks", 
      icon: "fa-tasks", 
      roles: ["admin", "employee"],
      badge: unreadCount && unreadCount > 0 ? unreadCount : null
    },
    { 
      id: "messages", 
      label: "Messages", 
      icon: "fa-comments", 
      roles: ["admin", "employee", "client"] 
    },
    { 
      id: "onboarding", 
      label: "My Strategy", 
      icon: "fa-chart-pie", 
      roles: ["client"] 
    },
    { 
      id: "test-onboarding", 
      label: "Test Onboarding", 
      icon: "fa-play-circle", 
      roles: ["client"],
      isDev: true
    },
    { 
      id: "users", 
      label: "Users", 
      icon: "fa-users", 
      roles: ["admin"] 
    },
    { 
      id: "settings", 
      label: "Settings", 
      icon: "fa-cog", 
      roles: ["admin", "employee", "client"] 
    },
  ];

  const availableMenuItems = menuItems.filter(item => item.roles.includes(currentRole));

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu when clicking outside on mobile
  useEffect(() => {
    function handleMobileClickOutside(event: MouseEvent) {
      const sidebar = document.getElementById('mobile-sidebar');
      const menuButton = document.getElementById('mobile-menu-button');
      
      if (mobileOpen && sidebar && !sidebar.contains(event.target as Node) && 
          menuButton && !menuButton.contains(event.target as Node)) {
        setMobileOpen(false);
      }
    }

    if (mobileOpen) {
      document.addEventListener("mousedown", handleMobileClickOutside);
      return () => document.removeEventListener("mousedown", handleMobileClickOutside);
    }
  }, [mobileOpen, setMobileOpen]);

  const handleRoleSwitch = async (newRole: "admin" | "employee" | "client") => {
    try {
      await switchRole({ newRole });
      toast.success(`Switched to ${newRole} role`);
      setShowUserMenu(false);
      // Refresh the page to update the UI with new role permissions
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || "Failed to switch role");
    }
  };

  const getAvailableRoles = () => {
    if (!user?.profile?.canSwitchRoles || !user?.profile?.availableRoles) {
      return [];
    }
    return user.profile.availableRoles.filter((role: string) => role !== currentRole);
  };

  const handleMenuItemClick = async (tabId: string) => {
    if (tabId === "test-onboarding") {
      try {
        await resetOnboarding();
        toast.success("Onboarding reset! You can now test the flow.");
        setActiveTab("overview");
      } catch (error: any) {
        toast.error(error.message || "Failed to reset onboarding");
      }
    } else {
      setActiveTab(tabId);
    }
    // Close mobile menu when item is selected
    setMobileOpen(false);
  };

  // Generate proper CSS classes
  const sidebarClasses = [
    "fixed left-0 top-0 h-full bg-white border-r border-gray-200 shadow-lg transition-all duration-300 z-40 flex flex-col",
    // Mobile: Always off-canvas, controlled by mobileOpen
    mobileOpen ? "translate-x-0" : "-translate-x-full",
    "lg:translate-x-0", // Desktop: always visible
    // Width classes
    "w-64", // Mobile width
    collapsed ? "lg:w-16" : "lg:w-64" // Desktop width based on collapsed state
  ].join(" ");

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div 
        id="mobile-sidebar"
        className={sidebarClasses}
      >
        {/* Header Section */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {!collapsed && (
              <div className="flex items-center space-x-3">
                <img 
                  src="https://eyeshots.co/wp-content/uploads/2025/05/eye-shots-horizontal-colored-logo-scaled.png" 
                  alt="Eye Shots Logo" 
                  className="w-15 object-fit"
                />
              </div>
            )}
            {/* Desktop collapse button */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:block p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <i className={`fas ${collapsed ? 'fa-bars' : 'fa-times'}`}></i>
            </button>
            {/* Mobile close button */}
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        {/* Main Menu Section */}
        <div className="flex-1 py-4">
          <nav className="space-y-1 px-3">
            {availableMenuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleMenuItemClick(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-all duration-200 group ${
                  activeTab === item.id
                    ? "bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white shadow-lg"
                    : "text-gray-700 hover:bg-gray-100 hover:text-purple-600"
                }`}
              >
                <i className={`fas ${item.icon} text-lg ${collapsed ? 'mx-auto' : ''}`}></i>
                {!collapsed && (
                  <>
                    <span className="font-medium">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {item.badge > 99 ? "99+" : item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Footer Section - User Avatar with Dropdown */}
        <div className="border-t border-gray-200 p-4 relative" ref={userMenuRef}>
          <button
            onClick={() => !collapsed && setShowUserMenu(!showUserMenu)}
            className={`w-full flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} p-2 rounded-lg hover:bg-gray-50 transition-colors ${
              !collapsed ? 'cursor-pointer' : ''
            }`}
            disabled={collapsed}
          >
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 rounded-full flex items-center justify-center text-white font-semibold">
              {user?.profile?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
            </div>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {user?.profile ? `${user.profile.firstName} ${user.profile.lastName}` : user?.email}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">
                    {currentRole}
                  </div>
                </div>
                <i className={`fas fa-chevron-up text-gray-400 text-xs transition-transform ${showUserMenu ? 'rotate-180' : ''}`}></i>
              </>
            )}
          </button>

          {/* User Dropdown Menu */}
          {showUserMenu && !collapsed && (
            <div className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
              {/* User Info Header */}
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {user?.profile?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {user?.profile ? `${user.profile.firstName} ${user.profile.lastName}` : user?.email}
                    </div>
                    <div className="text-xs text-gray-500">{user?.email}</div>
                    <div className="text-xs text-purple-600 capitalize font-medium">
                      {currentRole}
                    </div>
                  </div>
                </div>
              </div>

              {/* Role Switching Section */}
              {user?.profile?.canSwitchRoles && getAvailableRoles().length > 0 && (
                <>
                  <div className="px-4 py-2">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                      Switch Role
                    </div>
                    {getAvailableRoles().map((role: string) => (
                      <button
                        key={role}
                        onClick={() => handleRoleSwitch(role as "admin" | "employee" | "client")}
                        className="w-full flex items-center space-x-3 px-2 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-md transition-colors text-left"
                      >
                        <i className="fas fa-user-tag text-sm w-4"></i>
                        <span className="text-sm capitalize">{role}</span>
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-gray-100 my-2"></div>
                </>
              )}

              {/* Profile and Settings Links */}
              <div className="px-2">
                <button
                  onClick={() => {
                    setActiveTab('settings');
                    setShowUserMenu(false);
                    setMobileOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-2 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left"
                >
                  <i className="fas fa-user text-sm w-4"></i>
                  <span className="text-sm">Profile</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('settings');
                    setShowUserMenu(false);
                    setMobileOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-2 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left"
                >
                  <i className="fas fa-cog text-sm w-4"></i>
                  <span className="text-sm">Settings</span>
                </button>
              </div>

              <div className="border-t border-gray-100 my-2"></div>

              {/* Sign Out */}
              <div className="px-2">
                <div onClick={() => setShowUserMenu(false)}>
                  <SignOutButton />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
