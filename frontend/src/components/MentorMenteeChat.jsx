/**
 * Chat Component for Mentor-Mentee Communication
 * 
 * Component chat đầy đủ tích hợp với backend API
 * Hỗ trợ: danh sách conversations, tin nhắn real-time, gửi/nhận messages
 * 
 * Thiết kế: Giao diện hiện đại với màu sắc phù hợp theme tổng thể
 */

import React, { useEffect, useRef, useState } from "react";
import { useChat } from "../hooks/useChat.js";

// Utility: format thời gian hiển thị
function formatTime(timestamp) {
  if (!timestamp) return "";
  
  const date = new Date(timestamp);
  
  // Kiểm tra xem date có hợp lệ không
  if (isNaN(date.getTime())) {
    console.warn("Invalid timestamp:", timestamp);
    return "Invalid Date";
  }
  
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Utility: format ngày tháng
function formatDate(timestamp) {
  if (!timestamp) return "";
  
  const date = new Date(timestamp);
  
  // Kiểm tra xem date có hợp lệ không
  if (isNaN(date.getTime())) {
    console.warn("Invalid timestamp:", timestamp);
    return "Invalid Date";
  }
  
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) {
    return "Hôm nay";
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Hôm qua";
  } else {
    return date.toLocaleDateString("vi-VN");
  }
}

/**
 * Component chính cho Chat
 */
export default function MentorMenteeChat({ userRole = "mentor" }) {
  const {
    conversations,
    selectedConversation,
    selectedMessages,
    loading,
    sending,
    error,
    selectConversation,
    sendNewMessage,
    searchChats,
    selectedConversationId,
    totalUnreadCount
  } = useChat(userRole);
  
  // Debug logging
  console.log("🎯 MentorMenteeChat - conversations:", conversations);
  console.log("🎯 MentorMenteeChat - loading:", loading);
  console.log("🎯 MentorMenteeChat - error:", error);
  console.log("🎯 MentorMenteeChat - conversations.length:", conversations.length);
  console.log("🎯 MentorMenteeChat - selectedConversationId:", selectedConversationId);
  console.log("🎯 MentorMenteeChat - selectedConversation:", selectedConversation);
  console.log("🎯 MentorMenteeChat - selectedMessages:", selectedMessages);
  console.log("🎯 MentorMenteeChat - selectedMessages.length:", selectedMessages.length);
  
  const [draft, setDraft] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Auto scroll to bottom khi có tin nhắn mới
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedMessages.length]);

  // Xử lý gửi tin nhắn
  const handleSendMessage = async () => {
    const content = draft.trim();
    if (!content || !selectedConversationId || sending) return;
    
    setDraft("");
    await sendNewMessage(selectedConversationId, content);
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
            <p className="text-gray-600 font-medium">Đang tải cuộc trò chuyện...</p>
            <p className="text-gray-400 text-sm mt-1">Vui lòng chờ một chút</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[85vh] bg-white border border-gray-200 grid grid-cols-12 rounded-2xl overflow-hidden shadow-lg">
      {/* Sidebar: Danh sách conversations */}
      <aside className="col-span-4 md:col-span-3 bg-gradient-to-b from-slate-50 to-slate-100 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Tin nhắn</h2>
            {totalUnreadCount > 0 && (
              <span className="bg-blue-600 text-white text-xs px-2.5 py-1 rounded-full font-medium">
                {totalUnreadCount}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {userRole === "mentor" ? "Tin nhắn từ học viên" : "Tin nhắn với mentor"}
          </p>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm cuộc trò chuyện..."
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-auto bg-white">
          {error && (
            <div className="p-4 mx-4 mt-4 text-center bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </div>
              <button 
                onClick={() => window.location.reload()} 
                className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors underline"
              >
                Thử lại
              </button>
            </div>
          )}
          
          {loading && (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-gray-500 text-sm">Đang tải cuộc trò chuyện...</p>
            </div>
          )}
          
          {!loading && conversations.length === 0 && !error && (
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-gray-600 text-sm font-medium mb-1">
                {searchQuery ? "Không có kết quả tìm kiếm" : "Chưa có cuộc trò chuyện nào"}
              </p>
              <p className="text-gray-400 text-xs">
                {searchQuery ? "Thử tìm kiếm với từ khóa khác" : "Các tin nhắn mới sẽ xuất hiện ở đây"}
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
                  onClick={() => selectConversation(conversation.peerId)}
                />
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <section className="col-span-8 md:col-span-9 flex flex-col bg-white">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-4 bg-gradient-to-r from-blue-50 to-indigo-50">
              <img
                src={selectedConversation.menteeAvatar}
                alt={selectedConversation.menteeName}
                className="w-12 h-12 rounded-full border-2 border-white shadow-sm"
              />
              <div>
                <h3 className="font-semibold text-gray-900">{selectedConversation.menteeName}</h3>
                <p className="text-sm text-blue-600 font-medium">
                  {selectedConversation.unread > 0 ? "Có tin nhắn mới" : "Đang trò chuyện"}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-white"
            >
              {selectedMessages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-10 h-10 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                        <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                      </svg>
                    </div>
                    <p className="text-gray-600 font-medium">Bắt đầu cuộc trò chuyện</p>
                    <p className="text-gray-400 text-sm mt-1">Gửi tin nhắn đầu tiên để bắt đầu</p>
                  </div>
                </div>
              ) : (
                selectedMessages.map((message, index) => (
                  <MessageBubble 
                    key={message.id}
                    message={message}
                    userRole={userRole}
                    showDate={index === 0 || 
                      formatDate(message.at) !== formatDate(selectedMessages[index - 1]?.at)}
                  />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="px-6 py-4 border-t border-gray-200 bg-white">
              <div className="flex gap-3 items-end">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  placeholder="Nhập tin nhắn... (Enter: gửi, Shift+Enter: xuống dòng)"
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
                      <span>Gửi...</span>
                    </>
                  ) : (
                    <span>Gửi</span>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-neutral-500 mt-2">
                Nhấn <span className="font-semibold">Enter</span> để gửi • 
                <span className="font-semibold"> Shift+Enter</span> để xuống dòng
              </p>
            </div>
          </>
        ) : (
          // No conversation selected
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                <svg className="w-10 h-10 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-xl font-semibold text-gray-800 mb-2">Chọn cuộc trò chuyện</p>
              <p className="text-gray-500">Chọn một cuộc trò chuyện để bắt đầu nhắn tin</p>
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
          <span className={`font-semibold truncate text-sm ${isActive ? 'text-blue-900' : 'text-gray-900'}`}>
            {conversation.menteeName}
          </span>
          <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
            {lastMessage ? formatTime(new Date(lastMessage.sentAt).getTime()) : ""}
          </span>
        </div>
        
        <div className={`text-sm truncate mt-1 ${
          conversation.unread > 0 ? 'text-gray-700 font-medium' : 'text-gray-500'
        }`}>
          {lastMessage ? (
            <>
              {lastMessage.sender !== conversation.peerId ? "Bạn: " : ""}
              {lastMessage.content}
            </>
          ) : (
            "Chưa có tin nhắn"
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
  const isFromCurrentUser = message.sender === userRole;
  
  return (
    <div>
      {showDate && (
        <div className="text-center my-6">
          <span className="text-xs text-gray-600 bg-white border border-gray-200 px-4 py-2 rounded-full shadow-sm font-medium">
            {formatDate(message.at)}
          </span>
        </div>
      )}
      
      <div className={`flex ${isFromCurrentUser ? "justify-end" : "justify-start"}`}>
        <div
          className={`max-w-[75%] px-4 py-3 rounded-2xl shadow-sm whitespace-pre-wrap break-words ${
            isFromCurrentUser
              ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-br-md"
              : "bg-white border border-gray-200 text-gray-800 rounded-bl-md"
          } ${message.optimistic ? "opacity-70" : ""}`}
        >
          <div className="text-sm leading-relaxed">{message.text}</div>
          <div className={`text-xs mt-2 ${
            isFromCurrentUser ? "text-blue-100/80" : "text-gray-500"
          }`}>
            {formatTime(message.at)}
            {message.optimistic && " • Đang gửi..."}
          </div>
        </div>
      </div>
    </div>
  );
}
