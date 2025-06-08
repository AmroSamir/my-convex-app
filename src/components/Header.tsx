import { Authenticated, Unauthenticated, useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { SignOutButton } from "../SignOutButton";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

interface HeaderProps {
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

export function Header({ mobileOpen, setMobileOpen }: HeaderProps) {
  const user = useQuery(api.users.getCurrentUser);
  const unreadCount = useQuery(api.notifications.getUnreadCount);
  const notifications = useQuery(api.notifications.getMyNotifications, { limit: 10 });
  const taskStats = useQuery(api.tasks.getTaskStats);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  
  const switchRole = useMutation(api.users.switchRole);
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const handleNotificationClick = async (notificationId: string) => {
    try {
      await markAsRead({ notificationId: notificationId as any });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error("Failed to mark notifications as read");
    }
  };

  const getCurrentRole = () => {
    if (user?.profile?.currentActiveRole) {
      return user.profile.currentActiveRole;
    }
    return user?.profile?.role || "user";
  };

  const getAvailableRoles = () => {
    if (!user?.profile?.canSwitchRoles || !user?.profile?.availableRoles) {
      return [];
    }
    return user.profile.availableRoles.filter(role => role !== getCurrentRole());
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="max-w-[1600px] mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Mobile Menu */}
          <div className="flex items-center space-x-4">
            {/* Mobile Menu Button */}
            <button
              id="mobile-menu-button"
              onClick={() => setMobileOpen && setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <i className="fas fa-bars text-lg"></i>
            </button>
            
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">
              Eye Shots
            </h1>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <Authenticated>
              {/* Pending Tasks Counter */}
              {taskStats && taskStats.pending > 0 && (
                <div className="flex items-center space-x-2 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                  <i className="fas fa-clock text-orange-600"></i>
                  <span>{taskStats.pending} pending task{taskStats.pending !== 1 ? 's' : ''}</span>
                </div>
              )}

              {/* Notifications */}
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-600 hover:text-purple-600 transition-colors"
                >
                  <i className="fas fa-bell text-lg"></i>
                  {unreadCount && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                      {unreadCount && unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="text-xs text-purple-600 hover:text-purple-700"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    
                    <div className="max-h-80 overflow-y-auto">
                      {notifications && notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <div
                            key={notification._id}
                            onClick={() => handleNotificationClick(notification._id)}
                            className={`p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${
                              !notification.isRead ? "bg-purple-50" : ""
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              <div className={`w-2 h-2 rounded-full mt-2 ${
                                notification.type === "task" ? "bg-blue-500" :
                                notification.type === "system" ? "bg-green-500" : "bg-orange-500"
                              }`}></div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">
                                  {notification.title}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-2">
                                  {formatTimeAgo(notification._creationTime)}
                                </p>
                              </div>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-gray-500">
                          <i className="fas fa-bell-slash text-2xl mb-2"></i>
                          <p>No notifications</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {user?.profile?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-medium text-gray-900">
                      {user?.profile ? `${user.profile.firstName} ${user.profile.lastName}` : user?.email}
                    </div>
                    <div className="text-xs text-gray-500 capitalize flex items-center space-x-1">
                      <span>{getCurrentRole()}</span>
                      {user?.profile?.canSwitchRoles && getAvailableRoles().length > 0 && (
                        <i className="fas fa-exchange-alt text-purple-500"></i>
                      )}
                    </div>
                  </div>
                  <i className="fas fa-chevron-down text-gray-400 text-xs"></i>
                </button>

                {/* User Dropdown */}
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200">
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 rounded-full flex items-center justify-center text-white font-semibold">
                          {user?.profile?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {user?.profile ? `${user.profile.firstName} ${user.profile.lastName}` : user?.email}
                          </div>
                          <div className="text-sm text-gray-500">{user?.email}</div>
                          <div className="text-xs text-purple-600 capitalize font-medium flex items-center space-x-1">
                            <span>{getCurrentRole()}</span>
                            {user?.profile?.canSwitchRoles && getAvailableRoles().length > 0 && (
                              <i className="fas fa-exchange-alt"></i>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="py-2">
                      {/* Role Switching Section */}
                      {user?.profile?.canSwitchRoles && getAvailableRoles().length > 0 && (
                        <>
                          <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Switch Role
                          </div>
                          {getAvailableRoles().map((role) => (
                            <button
                              key={role}
                              onClick={() => handleRoleSwitch(role)}
                              className="w-full flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors text-left"
                            >
                              <i className="fas fa-user-tag w-4"></i>
                              <span className="capitalize">{role}</span>
                            </button>
                          ))}
                          <div className="border-t border-gray-100 my-2"></div>
                        </>
                      )}

                      <a
                        href="/profile"
                        className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <i className="fas fa-user w-4"></i>
                        <span>Profile</span>
                      </a>
                      <a
                        href="/settings"
                        className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <i className="fas fa-cog w-4"></i>
                        <span>Settings</span>
                      </a>
                      <div className="border-t border-gray-100 my-2"></div>
                      <div className="px-4 py-2">
                        <SignOutButton />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Authenticated>

            <Unauthenticated>
              <a
                href="/signin"
                className="px-6 py-2 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200"
              >
                Sign In
              </a>
            </Unauthenticated>
          </div>
        </div>
      </div>
    </header>
  );
}
