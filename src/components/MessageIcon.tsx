import { useState, useRef, useEffect } from "react";

export function MessageIcon() {
  const [showMessages, setShowMessages] = useState(false);
  const messageRef = useRef<HTMLDivElement>(null);
  
  // For now, we'll use a placeholder count - in a real app you'd have a messages system
  const messageCount = 0; // This would come from your messages API

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (messageRef.current && !messageRef.current.contains(event.target as Node)) {
        setShowMessages(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={messageRef}>
      <button
        onClick={() => setShowMessages(!showMessages)}
        className="relative p-2 text-gray-600 hover:text-purple-600 transition-colors rounded-lg hover:bg-gray-100"
      >
        <i className="fas fa-envelope text-lg"></i>
        {messageCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {messageCount > 99 ? "99+" : messageCount}
          </span>
        )}
      </button>

      {/* Messages Dropdown */}
      {showMessages && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Messages</h3>
          </div>
          
          <div className="p-8 text-center text-gray-500">
            <i className="fas fa-envelope-open text-2xl mb-2"></i>
            <p>No messages</p>
            <p className="text-xs text-gray-400 mt-1">Messages feature coming soon</p>
          </div>
        </div>
      )}
    </div>
  );
}
