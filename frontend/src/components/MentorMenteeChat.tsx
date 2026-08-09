import React, { useEffect, useRef, useState, useCallback } from "react";
import { useChat } from "../hooks/useChat.js";

// Format thời gian hiển thị
function formatTime(timestamp) {
  if (!timestamp) return "";

  const date = new Date(timestamp);

  if (isNaN(date.getTime())) {
    console.warn("Invalid timestamp:", timestamp);
    return "Invalid Date";
  }

  // 24-hour format
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

// Format ngày tháng
function formatDate(timestamp) {
  if (!timestamp) return "";

  const date = new Date(timestamp);

  if (isNaN(date.getTime())) {
    console.warn("Invalid timestamp:", timestamp);
    return "Invalid Date";
  }

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  } else {
    // 24-hour format for date (keep locale for date, but time will be handled by formatTime)
    return date.toLocaleDateString("en-GB");
  }
}

// Component chính cho Chat
export default function MentorMenteeChat({ userRole = "mentor" }) {
  const {
    conversations,
    selectedConversation,
    selectedMessages,
    loading,
    sending,
    error,
    isSocketConnected,
    selectConversation,
    sendNewMessage,
    searchChats,
    markConversationAsRead,
    selectedConversationId,
    totalUnreadCount,
  } = useChat(userRole);

  const [draft, setDraft] = useState<any>("");
  const [searchQuery, setSearchQuery] = useState<any>("");
  const [pendingMentorChat, setPendingMentorChat] = useState<any>(null); // New state for pending mentor chat
  const messagesContainerRef = useRef<any>(null);
  const messagesEndRef = useRef<any>(null); // Thêm lại ref cho cuối messages

  // Helper function để scroll đến cuối - chỉ scroll messages area
  const scrollToBottom = useCallback((immediate = false) => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const scrollHeight = container.scrollHeight;
      const height = container.clientHeight;
      const maxScrollTop = scrollHeight - height;

      if (immediate) {
        container.scrollTop = maxScrollTop;
      } else {
        container.scrollTo({
          top: maxScrollTop,
          behavior: "smooth",
        });
      }
    }
  }, []);

  // Xử lý chọn conversation và đánh dấu đã đọc
  const handleSelectConversation = useCallback(
    (peerId) => {
      selectConversation(peerId);
      // Đánh dấu tin nhắn đã đọc khi chọn conversation
      if (peerId) {
        markConversationAsRead(peerId);
      }
    },
    [selectConversation, markConversationAsRead]
  );

  // Auto scroll to bottom khi có tin nhắn mới - chỉ scroll messages container
  useEffect(() => {
    if (selectedMessages.length > 0) {
      // Delay nhỏ để DOM render xong, sau đó scroll messages area
      setTimeout(() => {
        scrollToBottom();
      }, 50);
    }
  }, [selectedMessages.length, scrollToBottom]);

  // Auto scroll khi chọn conversation mới
  useEffect(() => {
    if (selectedConversationId) {
      // Scroll messages area đến cuối khi chọn conversation
      setTimeout(() => {
        scrollToBottom();
      }, 150);
    }
  }, [selectedConversationId, scrollToBottom]);

  // Auto-select mentor conversation when coming from mentor profile
  useEffect(() => {
    const chatWithMentorData = localStorage.getItem("chatWithMentor");
    if (chatWithMentorData) {
      try {
        const mentorInfo = JSON.parse(chatWithMentorData);
        const mentorId = mentorInfo.mentorId;

        // Find conversation with this mentor
        const mentorConversation = conversations.find(
          (conv) => conv.peerId === mentorId || conv.id === mentorId
        );

        if (mentorConversation) {
          // Auto-select existing conversation
          const conversationId =
            mentorConversation.peerId || mentorConversation.id;
          handleSelectConversation(conversationId);
          console.log(
            "Auto-selected conversation with mentor:",
            mentorInfo.mentorName
          );
          setPendingMentorChat(null); // Clear pending chat since we found existing conversation
        } else {
          // Set up for new conversation
          setPendingMentorChat({
            mentorId: mentorId,
            mentorName: mentorInfo.mentorName,
            mentorAvatar: mentorInfo.mentorAvatar,
          });
          console.log(
            "Set up new conversation with mentor:",
            mentorInfo.mentorName
          );
        }

        // Clear the localStorage after processing
        localStorage.removeItem("chatWithMentor");
      } catch (error) {
        console.error("Error parsing mentor chat data:", error);
        localStorage.removeItem("chatWithMentor");
      }
    }
  }, [conversations, handleSelectConversation]);

  // Xử lý gửi tin nhắn
  const handleSendMessage = async () => {
    const content = draft.trim();
    if (!content || sending) return;

    setDraft("");

    // Check if we're starting a new conversation with a mentor
    if (pendingMentorChat && !selectedConversationId) {
      console.log(
        "Starting new conversation with mentor:",
        pendingMentorChat.mentorName
      );

      // Send message to the mentor
      await sendNewMessage(pendingMentorChat.mentorId, content);

      // Clear pending mentor chat
      setPendingMentorChat(null);

      // The conversation should now appear in the conversations list
      // and the useChat hook will handle updating the UI
    } else if (selectedConversationId) {
      // Send message to existing conversation
      await sendNewMessage(selectedConversationId, content);
    }

    // Scroll messages area đến cuối để thấy tin nhắn mới
    // Input box vẫn cố định ở bottom
    setTimeout(() => {
      scrollToBottom();
    }, 100);
  };

  // Xử lý Enter để gửi tin nhắn
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Xử lý tìm kiếm conversations
  const handleSearch = (query) => {
    setSearchQuery(query);
    searchChats(query);
  };

  // Loading state
  if (loading && conversations.length === 0) {
    return (
      <div className="w-full h-[85vh] bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-lg">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">
              Loading conversations...
            </p>
            <p className="text-gray-400 text-sm mt-1">Please wait a moment</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[85vh] bg-white border border-gray-200 grid grid-cols-12 rounded-2xl overflow-hidden shadow-lg">
      {/* Sidebar: Conversation list */}
      <aside className="col-span-4 md:col-span-3 bg-gradient-to-b from-slate-50 to-slate-100 border-r border-gray-200 flex flex-col max-h-full overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-gray-200 bg-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
              {totalUnreadCount > 0 && (
                <div className="flex items-center gap-1.5 bg-red-50 text-red-600 px-2.5 py-1 rounded-full border border-red-200">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                  <span className="text-xs font-medium">
                    {totalUnreadCount} new
                  </span>
                </div>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {userRole === "mentor"
              ? "Messages from mentees"
              : "Messages with mentors"}
          </p>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
          <div className="relative">
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-4 py-2.5 pl-10 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
            />
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto min-h-0 bg-white">
          {error && (
            <div className="p-4 mx-4 mt-4 text-center bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <svg
                  className="w-5 h-5 text-red-500 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors underline"
              >
                Try again
              </button>
            </div>
          )}

          {loading && (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-gray-500 text-sm">Loading conversations...</p>
            </div>
          )}

          {!loading && conversations.length === 0 && !error && (
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <p className="text-gray-600 text-sm font-medium mb-1">
                {searchQuery ? "No search results" : "No conversations yet"}
              </p>
              <p className="text-gray-400 text-xs">
                {searchQuery
                  ? "Try searching with a different keyword"
                  : "New messages will appear here"}
              </p>
            </div>
          )}

          {!loading && conversations.length > 0 && (
            <div className="divide-y divide-gray-100">
              {conversations.map((conversation) => (
                <ConversationItem
                  key={conversation.peerId}
                  conversation={conversation}
                  isActive={conversation.peerId === selectedConversationId}
                  onClick={() => handleSelectConversation(conversation.peerId)}
                />
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Main Chat Area - Layout như Messenger */}
      <section className="col-span-8 md:col-span-9 flex flex-col bg-white max-h-full relative overflow-hidden">
        {selectedConversationId ? (
          <>
            {/* Chat Header - Fixed */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0 z-10">
              <img
                src={
                  selectedConversation?.menteeAvatar ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${selectedConversationId}`
                }
                alt={
                  selectedConversation?.menteeName ||
                  `User ${selectedConversationId}`
                }
                className="w-12 h-12 rounded-full border-2 border-white shadow-sm"
              />
              <div>
                <h3 className="font-semibold text-gray-900">
                  {selectedConversation?.menteeName ||
                    `User ${selectedConversationId}`}
                </h3>
                <p className="text-sm text-blue-600 font-medium">
                  {selectedConversation?.unread > 0
                    ? "New message"
                    : "Chatting"}
                </p>
              </div>
            </div>

            {/* Messages - Like Messenger: only this area scrolls, input fixed */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto min-h-0 p-6 space-y-4 bg-gradient-to-b from-gray-50 to-white messages-container"
              style={{
                maxHeight: "calc(100% - 120px)", // Đảm bảo để chỗ cho input
                scrollBehavior: "smooth",
                overflowX: "hidden",
                /* Custom scrollbar như Messenger */
                scrollbarWidth: "thin",
                scrollbarColor: "#CBD5E0 #F7FAFC",
              }}
            >
              {selectedMessages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-10 h-10 text-gray-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                        <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                      </svg>
                    </div>
                    <p className="text-gray-600 font-medium">
                      Start the conversation
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      Send the first message to begin
                    </p>
                  </div>
                </div>
              ) : (
                selectedMessages.map((message, index) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    userRole={userRole}
                    showDate={
                      index === 0 ||
                      formatDate(message.at) !==
                        formatDate(selectedMessages[index - 1]?.at)
                    }
                  />
                ))
              )}
              {/* Div anchor để scroll đến cuối */}
              <div ref={messagesEndRef} className="h-1" />
            </div>

            <div
              className="px-6 py-4 border-t border-gray-200 bg-white flex-shrink-0 sticky bottom-0 shadow-lg"
              style={{
                position: "sticky",
                bottom: 0,
                zIndex: 20,
                backgroundColor: "white",
              }}
            >
              <div className="flex gap-3 items-end">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  placeholder="Type a message... (Enter: send, Shift+Enter: new line)"
                  className="flex-1 max-h-32 min-h-[44px] resize-none px-4 py-3 rounded-xl bg-gray-50 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-500 transition-all duration-200"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!draft.trim() || sending}
                  className="px-4 h-[44px] rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 font-medium flex items-center gap-2 min-w-[80px] justify-center"
                >
                  {sending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <span>Send</span>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-neutral-500 mt-2">
                Press <span className="font-semibold">Enter</span> to send •
                <span className="font-semibold"> Shift+Enter</span> for new line
              </p>
            </div>
          </>
        ) : pendingMentorChat ? (
          // New conversation with mentor - Show mentor info and input
          <>
            {/* Chat Header for new mentor */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0 z-10">
              <img
                src={
                  pendingMentorChat.mentorAvatar ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${pendingMentorChat.mentorName}`
                }
                alt={pendingMentorChat.mentorName}
                className="w-12 h-12 rounded-full border-2 border-white shadow-sm"
              />
              <div>
                <h3 className="font-semibold text-gray-900">
                  {pendingMentorChat.mentorName}
                </h3>
                <p className="text-sm text-blue-600 font-medium">
                  New conversation
                </p>
              </div>
            </div>

            {/* New conversation welcome message */}
            <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-4 bg-gradient-to-b from-gray-50 to-white">
              <div className="h-full flex items-center justify-center">
                <div className="text-center max-w-md">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-10 h-10 text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Start chatting with {pendingMentorChat.mentorName}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Send the first message to start the conversation
                  </p>
                </div>
              </div>
            </div>

            {/* Input for new conversation */}
            <div className="px-6 py-4 border-t border-gray-200 bg-white flex-shrink-0">
              <div className="flex gap-3 items-end">
                <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-3 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                  <textarea
                    rows={1}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Message ${pendingMentorChat.mentorName}...`}
                    className="w-full resize-none bg-transparent border-0 outline-none text-gray-900 placeholder-gray-500 text-sm"
                    style={{ minHeight: "20px", maxHeight: "100px" }}
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!draft.trim() || sending}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white p-3 rounded-xl transition-all duration-200 flex-shrink-0 shadow-sm hover:shadow-md disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          // No conversation selected - Show welcome screen
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50 min-h-0">
            <div className="text-center max-w-md px-6">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
                <svg
                  className="w-16 h-16 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                {userRole === "mentor"
                  ? "Messages from mentees"
                  : "Messages with mentors"}
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed text-lg">
                {conversations.length > 0
                  ? "Select a conversation from the list on the left to start messaging"
                  : userRole === "mentor"
                  ? "No mentee has messaged you yet. New messages will appear in the list on the left."
                  : "No conversations with mentors yet. You can start a new conversation."}
              </p>

              {conversations.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-center gap-2 text-sm text-blue-700 mb-2">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    <span className="font-medium">Messages</span>
                  </div>
                  <p className="text-xs text-blue-600">
                    Select a conversation to start messaging
                  </p>
                </div>
              )}

              <div className="text-sm text-gray-500">
                <p>
                  💬 Chat with {userRole === "mentor" ? "mentees" : "mentors"}
                </p>
                <p className="mt-1">� WebSocket connection - no delay</p>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

/**
 * Component cho từng conversation item trong sidebar
 */
function ConversationItem({ conversation, isActive, onClick }) {
  const lastMessage = conversation.lastMessage;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-4 py-4 text-left hover:bg-blue-50 transition-all duration-200 ${
        isActive ? "bg-blue-50 border-r-3 border-blue-500 shadow-sm" : ""
      }`}
    >
      <div className="relative">
        <img
          src={conversation.menteeAvatar}
          alt={conversation.menteeName}
          className="w-12 h-12 rounded-full border-2 border-white shadow-sm bg-gray-100"
        />
        {conversation.unread > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-sm">
            <span className="text-xs font-bold text-white">
              {conversation.unread > 9 ? "9+" : conversation.unread}
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span
            className={`font-semibold truncate text-sm ${
              isActive ? "text-blue-900" : "text-gray-900"
            }`}
          >
            {conversation.menteeName}
          </span>
          <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
            {lastMessage
              ? formatTime(new Date(lastMessage.sentAt).getTime())
              : ""}
          </span>
        </div>

        <div
          className={`text-sm truncate mt-1 ${
            conversation.unread > 0
              ? "text-gray-700 font-medium"
              : "text-gray-500"
          }`}
        >
          {lastMessage ? (
            <>
              {lastMessage.sender !== conversation.peerId ? "Bạn: " : ""}
              {lastMessage.content}
            </>
          ) : (
            "No messages yet"
          )}
        </div>
      </div>
    </button>
  );
}

/**
 * Component cho message bubble
 */
function MessageBubble({ message, userRole, showDate }) {
  // Sử dụng field isFromCurrentUser để xác định vị trí hiển thị tin nhắn
  const isFromCurrentUser =
    message.isFromCurrentUser !== undefined
      ? message.isFromCurrentUser
      : message.sender === userRole; // Fallback cho compatibility

  return (
    <div>
      {showDate && (
        <div className="text-center my-6">
          <span className="text-xs text-gray-600 bg-white border border-gray-200 px-4 py-2 rounded-full shadow-sm font-medium">
            {formatDate(message.at)}
          </span>
        </div>
      )}

      <div
        className={`flex ${
          isFromCurrentUser ? "justify-end" : "justify-start"
        }`}
      >
        <div
          className={`max-w-[75%] px-4 py-3 rounded-2xl shadow-sm whitespace-pre-wrap break-words word-wrap overflow-wrap-anywhere ${
            isFromCurrentUser
              ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-br-md"
              : "bg-white border border-gray-200 text-gray-800 rounded-bl-md"
          } ${message.optimistic ? "opacity-70" : ""}`}
        >
          <div className="text-sm leading-relaxed">{message.text}</div>
          <div
            className={`text-xs mt-2 ${
              isFromCurrentUser ? "text-blue-100/80" : "text-gray-500"
            }`}
          >
            {formatTime(message.at)}
            {message.optimistic && " • Sending..."}
          </div>
        </div>
      </div>
    </div>
  );
}
