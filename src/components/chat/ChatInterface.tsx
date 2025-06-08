import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../../convex/_generated/dataModel";

interface ChatInterfaceProps {
  user: any;
}

export function ChatInterface({ user }: ChatInterfaceProps) {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);

  const conversations = useQuery(api.chat.getMyConversations);
  const updateOnlineStatus = useMutation(api.chat.updateOnlineStatus);

  // Update online status on mount and cleanup
  useEffect(() => {
    updateOnlineStatus({ isOnline: true });
    
    const handleBeforeUnload = () => {
      updateOnlineStatus({ isOnline: false });
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    
    // Update online status every 30 seconds
    const interval = setInterval(() => {
      updateOnlineStatus({ isOnline: true });
    }, 30000);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      clearInterval(interval);
      updateOnlineStatus({ isOnline: false });
    };
  }, [updateOnlineStatus]);

  return (
    <div className="h-full flex bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Sidebar - Conversations List */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowNewChat(true)}
                className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                title="New Chat"
              >
                <i className="fas fa-plus"></i>
              </button>
              <button
                onClick={() => setShowNewGroup(true)}
                className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                title="New Group"
              >
                <i className="fas fa-users"></i>
              </button>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            />
            <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {conversations?.map((conversation) => 
            conversation ? (
              <ConversationItem
                key={conversation._id}
                conversation={conversation}
                isSelected={selectedConversation === conversation._id}
                onClick={() => setSelectedConversation(conversation._id)}
              />
            ) : null
          )}
          
          {(!conversations || conversations.length === 0) && (
            <div className="p-8 text-center text-gray-500">
              <i className="fas fa-comments text-3xl mb-3"></i>
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs text-gray-400 mt-1">Start a new chat to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <ChatWindow 
            conversationId={selectedConversation as Id<"conversations">}
            user={user}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <i className="fas fa-comments text-6xl text-gray-300 mb-4"></i>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Select a conversation</h3>
              <p className="text-gray-500">Choose a conversation from the sidebar to start chatting</p>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showNewChat && (
        <NewChatModal
          onClose={() => setShowNewChat(false)}
          onConversationCreated={(id) => {
            setSelectedConversation(id);
            setShowNewChat(false);
          }}
        />
      )}

      {showNewGroup && (
        <NewGroupModal
          onClose={() => setShowNewGroup(false)}
          onGroupCreated={(id) => {
            setSelectedConversation(id);
            setShowNewGroup(false);
          }}
        />
      )}
    </div>
  );
}

function ConversationItem({ conversation, isSelected, onClick }: {
  conversation: any;
  isSelected: boolean;
  onClick: () => void;
}) {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div
      onClick={onClick}
      className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
        isSelected ? 'bg-purple-50 border-purple-200' : 'hover:bg-gray-50'
      }`}
    >
      <div className="flex items-center space-x-3">
        {/* Avatar */}
        <div className="relative">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 rounded-full flex items-center justify-center text-white font-semibold">
            {conversation.displayName?.[0]?.toUpperCase() || "?"}
          </div>
          {conversation.type === "direct" && conversation.participants?.find((p: any) => p.userId !== conversation.participants.find((pp: any) => pp.userId === conversation.participants[0].userId)?.userId)?.isOnline && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {conversation.displayName || "Unknown"}
            </h3>
            {conversation.lastMessageAt && (
              <span className="text-xs text-gray-500">
                {formatTime(conversation.lastMessageAt)}
              </span>
            )}
          </div>
          
          <div className="flex items-center justify-between mt-1">
            <p className="text-sm text-gray-600 truncate">
              {conversation.lastMessage || "No messages yet"}
            </p>
            {conversation.unreadCount > 0 && (
              <span className="bg-purple-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatWindow({ conversationId, user }: {
  conversationId: Id<"conversations">;
  user: any;
}) {
  const [messageText, setMessageText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [replyTo, setReplyTo] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const messages = useQuery(api.chat.getMessages, { conversationId });
  const sendMessage = useMutation(api.chat.sendMessage);
  const sendFileMessage = useMutation(api.chat.sendFileMessage);
  const generateUploadUrl = useMutation(api.chat.generateUploadUrl);
  const markMessagesAsRead = useMutation(api.chat.markMessagesAsRead);
  const deleteMessage = useMutation(api.chat.deleteMessage);
  const editMessage = useMutation(api.chat.editMessage);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark messages as read when conversation is opened
  useEffect(() => {
    markMessagesAsRead({ conversationId });
  }, [conversationId, markMessagesAsRead]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    try {
      await sendMessage({
        conversationId,
        content: messageText.trim(),
        replyToId: replyTo?._id,
      });
      setMessageText("");
      setReplyTo(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to send message");
    }
  };

  const handleFileUpload = async (file: File, type: "image" | "file" | "voice") => {
    try {
      const uploadUrl = await generateUploadUrl();
      
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) {
        throw new Error("Upload failed");
      }

      const { storageId } = await result.json();

      await sendFileMessage({
        conversationId,
        fileId: storageId,
        type,
        fileName: file.name,
        fileSize: file.size,
        replyToId: replyTo?._id,
      });

      setReplyTo(null);
      toast.success("File sent successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to send file");
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        await handleFileUpload(audioBlob as File, "voice");
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      toast.error("Failed to start recording");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <>
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 rounded-full flex items-center justify-center text-white font-semibold">
            C
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Conversation</h3>
            <p className="text-sm text-gray-500">Online</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages?.map((message) => (
          <MessageBubble
            key={message._id}
            message={message}
            isOwn={message.senderId === user._id}
            onReply={() => setReplyTo(message)}
            onDelete={() => deleteMessage({ messageId: message._id })}
            onEdit={(content) => editMessage({ messageId: message._id, content })}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Preview */}
      {replyTo && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-1 h-8 bg-purple-600 rounded"></div>
              <div>
                <p className="text-xs text-purple-600 font-medium">
                  Replying to {replyTo.senderName}
                </p>
                <p className="text-sm text-gray-600 truncate">
                  {replyTo.content || `${replyTo.type} message`}
                </p>
              </div>
            </div>
            <button
              onClick={() => setReplyTo(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            >
              <i className="fas fa-paperclip"></i>
            </button>
            <button
              type="button"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) handleFileUpload(file, 'image');
                };
                input.click();
              }}
              className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            >
              <i className="fas fa-image"></i>
            </button>
          </div>

          <div className="flex-1 relative">
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type a message..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
          </div>

          <div className="flex space-x-2">
            <button
              type="button"
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onMouseLeave={stopRecording}
              className={`p-2 rounded-lg transition-colors ${
                isRecording 
                  ? 'bg-red-500 text-white' 
                  : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
              }`}
            >
              <i className="fas fa-microphone"></i>
            </button>
            
            <button
              type="submit"
              disabled={!messageText.trim()}
              className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <i className="fas fa-paper-plane"></i>
            </button>
          </div>
        </form>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file, 'file');
          }}
        />
      </div>
    </>
  );
}

function MessageBubble({ message, isOwn, onReply, onDelete, onEdit }: {
  message: any;
  isOwn: boolean;
  onReply: () => void;
  onDelete: () => void;
  onEdit: (content: string) => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content || "");

  const handleEdit = () => {
    onEdit(editContent);
    setIsEditing(false);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-xs lg:max-w-md relative group ${
          isOwn ? 'order-2' : 'order-1'
        }`}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* Reply indicator */}
        {message.replyTo && (
          <div className={`mb-1 p-2 rounded-lg bg-gray-100 border-l-4 border-purple-500 ${
            isOwn ? 'mr-2' : 'ml-2'
          }`}>
            <p className="text-xs text-purple-600 font-medium">
              {message.replyTo.senderName}
            </p>
            <p className="text-xs text-gray-600 truncate">
              {message.replyTo.content || `${message.replyTo.type} message`}
            </p>
          </div>
        )}

        {/* Message content */}
        <div
          className={`px-4 py-2 rounded-lg ${
            isOwn
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-900'
          }`}
        >
          {!isOwn && (
            <p className="text-xs font-medium mb-1 opacity-70">
              {message.senderName}
            </p>
          )}

          {message.type === "text" && (
            <>
              {isEditing ? (
                <div className="space-y-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full p-2 rounded bg-white text-gray-900 text-sm"
                    rows={2}
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={handleEdit}
                      className="text-xs px-2 py-1 bg-green-500 text-white rounded"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="text-xs px-2 py-1 bg-gray-500 text-white rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm whitespace-pre-wrap">
                  {message.content}
                  {message.isEdited && (
                    <span className="text-xs opacity-70 ml-2">(edited)</span>
                  )}
                </p>
              )}
            </>
          )}

          {message.type === "image" && message.fileUrl && (
            <img
              src={message.fileUrl}
              alt="Shared image"
              className="max-w-full h-auto rounded"
            />
          )}

          {message.type === "voice" && message.fileUrl && (
            <div className="flex items-center space-x-2">
              <i className="fas fa-play text-sm"></i>
              <div className="flex-1 h-1 bg-white bg-opacity-30 rounded">
                <div className="h-full bg-white rounded w-1/3"></div>
              </div>
              <span className="text-xs">
                {message.duration ? `${Math.floor(message.duration)}s` : "0s"}
              </span>
            </div>
          )}

          {message.type === "file" && (
            <div className="flex items-center space-x-2">
              <i className="fas fa-file text-sm"></i>
              <div>
                <p className="text-sm font-medium">{message.fileName}</p>
                <p className="text-xs opacity-70">
                  {message.fileSize ? `${Math.round(message.fileSize / 1024)} KB` : ""}
                </p>
              </div>
            </div>
          )}

          <p className="text-xs opacity-70 mt-1">
            {formatTime(message._creationTime)}
          </p>
        </div>

        {/* Message actions */}
        {showActions && (
          <div className={`absolute top-0 ${isOwn ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} flex space-x-1 bg-white shadow-lg rounded-lg p-1`}>
            <button
              onClick={onReply}
              className="p-1 text-gray-600 hover:text-purple-600 text-xs"
              title="Reply"
            >
              <i className="fas fa-reply"></i>
            </button>
            {isOwn && message.type === "text" && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 text-gray-600 hover:text-blue-600 text-xs"
                title="Edit"
              >
                <i className="fas fa-edit"></i>
              </button>
            )}
            {isOwn && (
              <button
                onClick={onDelete}
                className="p-1 text-gray-600 hover:text-red-600 text-xs"
                title="Delete"
              >
                <i className="fas fa-trash"></i>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function NewChatModal({ onClose, onConversationCreated }: {
  onClose: () => void;
  onConversationCreated: (id: string) => void;
}) {
  const users = useQuery(api.chat.getUsers);
  const createDirectConversation = useMutation(api.chat.createDirectConversation);

  const handleCreateChat = async (userId: string) => {
    try {
      const conversationId = await createDirectConversation({ 
        otherUserId: userId as Id<"users"> 
      });
      onConversationCreated(conversationId);
    } catch (error: any) {
      toast.error(error.message || "Failed to create conversation");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">New Chat</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="space-y-2">
          {users?.map((user) => (
            <button
              key={user._id}
              onClick={() => handleCreateChat(user._id)}
              className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
            >
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 rounded-full flex items-center justify-center text-white font-semibold">
                {user.name?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{user.name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
              {user.isOnline && (
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function NewGroupModal({ onClose, onGroupCreated }: {
  onClose: () => void;
  onGroupCreated: (id: string) => void;
}) {
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const users = useQuery(api.chat.getUsers);
  const createGroupConversation = useMutation(api.chat.createGroupConversation);

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) {
      toast.error("Please enter a group name and select at least one user");
      return;
    }

    try {
      const conversationId = await createGroupConversation({
        name: groupName.trim(),
        description: groupDescription.trim() || undefined,
        participantIds: selectedUsers as Id<"users">[],
      });
      onGroupCreated(conversationId);
    } catch (error: any) {
      toast.error(error.message || "Failed to create group");
    }
  };

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">New Group</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group Name
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter group name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter group description"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add Members ({selectedUsers.length} selected)
            </label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {users?.map((user) => (
                <label
                  key={user._id}
                  className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user._id)}
                    onChange={() => toggleUser(user._id)}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {user.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateGroup}
              disabled={!groupName.trim() || selectedUsers.length === 0}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Create Group
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
