/**
 * Custom Hook for Chat/Message functionality
 * 
 * Cung cấp state management và API calls cho chức năng chat
 * Bao gồm: conversations, messages, sending, real-time updates
 */

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { 
  getConversations, 
  getMessages, 
  sendMessage, 
  markMessagesAsRead,
  searchConversations 
} from "../api/modules/message.api.js";

/**
 * Hook chính cho chat functionality
 * @param {string} userRole - Role của user hiện tại ('mentor' | 'mentee')
 * @returns {Object} Chat state và functions
 */
export const useChat = (userRole = 'mentor') => {
  // State management
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [messages, setMessages] = useState({}); // Object với key là conversationId
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  // Ref để tránh stale closure
  const selectedConversationIdRef = useRef(selectedConversationId);
  selectedConversationIdRef.current = selectedConversationId;

  // Tính toán conversation được chọn
  const selectedConversation = useMemo(() => {
    return conversations.find(conv => conv.peerId === selectedConversationId) || null;
  }, [conversations, selectedConversationId]);

  // Lấy messages của conversation được chọn
  const selectedMessages = useMemo(() => {
    return selectedConversationId ? (messages[selectedConversationId] || []) : [];
  }, [messages, selectedConversationId]);

  /**
   * Load danh sách conversations khi component mount
   */
  const loadConversations = useCallback(async () => {
    console.log("🚀 loadConversations called!");
    try {
      setLoading(true);
      setError(null);
      
      console.log("📡 Calling getConversations API...");
      const response = await getConversations();
      console.log("📡 API Response:", response);
      console.log("📡 API Response structure:", JSON.stringify(response, null, 2));
      const conversationsData = response.items || response.data?.items || response || [];
      
      console.log("🔍 DEBUG - Raw conversations data:", conversationsData);
      console.log("🔍 DEBUG - Number of conversations:", conversationsData.length);
      
      // Transform data để phù hợp với UI format
      const transformedConversations = conversationsData.map(conv => {
        console.log("🔍 DEBUG - Processing conversation:", conv);
        
        // Extract user info from backend
        const peerInfo = conv.peerInfo || {};
        const displayName = peerInfo.firstName && peerInfo.lastName 
          ? `${peerInfo.firstName} ${peerInfo.lastName}`.trim()
          : peerInfo.userName || `User ${conv.peerId}`;
        
        const avatarUrl = peerInfo.avatarUrl || 
          `https://api.dicebear.com/7.x/initials/svg?seed=${displayName}`;
        
        return {
          id: conv.peerId,
          peerId: conv.peerId,
          menteeName: displayName,
          menteeAvatar: avatarUrl,
          lastMessage: conv.lastMessage,
          unread: conv.unreadCount || 0,
          updatedAt: conv.lastMessage?.sentAt || new Date().toISOString(),
          // Thêm thông tin user
          peerInfo: peerInfo
        };
      });

      console.log("🔍 DEBUG - Transformed conversations:", transformedConversations);
      setConversations(transformedConversations);
      
      // Tự động chọn conversation đầu tiên nếu có
      if (transformedConversations.length > 0 && !selectedConversationIdRef.current) {
        console.log("🔍 DEBUG - Auto selecting first conversation:", transformedConversations[0].peerId);
        setSelectedConversationId(transformedConversations[0].peerId);
      }
      
    } catch (err) {
      console.error("❌ Error loading conversations:", err);
      console.error("❌ Error details:", err.message);
      console.error("❌ Error response:", err.response?.data);
      console.error("❌ Error status:", err.response?.status);
      setError("Không thể tải danh sách cuộc trò chuyện");
    } finally {
      console.log("✅ loadConversations finished, setting loading to false");
      setLoading(false);
    }
  }, []); // Bỏ selectedConversationId dependency để tránh infinite loop

  /**
   * Load messages cho một conversation cụ thể
   */
  const loadMessages = useCallback(async (peerId, limit = 50) => {
    if (!peerId) {
      console.log("❌ loadMessages - peerId is empty:", peerId);
      return;
    }
    
    console.log("🚀 loadMessages called for peerId:", peerId, "limit:", limit);
    
    try {
      setLoading(true);
      
      console.log("📡 Calling getMessages API for peer:", peerId);
      const response = await getMessages(peerId, limit);
      console.log("📡 API Response:", response);
      console.log("📡 API Response structure:", JSON.stringify(response, null, 2));
      
      const messagesData = response.items || response.data?.items || response || [];
      
      console.log("🔍 DEBUG - Raw messages for peer", peerId, ":", messagesData);
      console.log("🔍 DEBUG - Number of messages:", messagesData.length);
      console.log("🔍 DEBUG - First message sample:", messagesData[0]);
      
      // Transform messages để phù hợp với UI format
      const transformedMessages = messagesData.reverse().map(msg => {
        console.log("🔄 Transforming message:", msg);
        return {
          id: msg._id,
          sender: msg.sender === peerId ? 'mentee' : userRole, // Xác định sender
          text: msg.content,
          at: new Date(msg.sentAt).getTime(),
          messageType: msg.messageType,
          attachments: msg.attachments,
          read: msg.read
        };
      });

      console.log("🔍 DEBUG - Transformed messages:", transformedMessages);
      console.log("🔍 DEBUG - Setting messages for peerId:", peerId);
      
      setMessages(prev => {
        const newMessages = {
          ...prev,
          [peerId]: transformedMessages
        };
        console.log("🔍 DEBUG - Updated messages state:", newMessages);
        return newMessages;
      });
      
    } catch (err) {
      console.error("❌ Error loading messages:", err);
      console.error("❌ Error details:", err.message);
      console.error("❌ Error response:", err.response?.data);
      console.error("❌ Error status:", err.response?.status);
      setError("Không thể tải tin nhắn");
    } finally {
      console.log("✅ loadMessages finished, setting loading to false");
      setLoading(false);
    }
  }, [userRole]);

  /**
   * Chọn conversation và load messages
   */
  const selectConversation = useCallback(async (peerId) => {
    setSelectedConversationId(peerId);
    
    // Đánh dấu đã đọc
    try {
      await markMessagesAsRead(peerId);
      // Cập nhật unread count trong conversations
      setConversations(prev => prev.map(conv => 
        conv.peerId === peerId ? { ...conv, unread: 0 } : conv
      ));
    } catch (err) {
      console.error("Error marking messages as read:", err);
    }
    
    // Load messages nếu chưa có
    if (!messages[peerId]) {
      await loadMessages(peerId);
    }
  }, [messages, loadMessages]);

  /**
   * Gửi tin nhắn mới
   */
  const sendNewMessage = useCallback(async (peerId, content) => {
    if (!peerId || !content.trim()) return;
    
    setSending(true);
    const tempId = `temp-${Date.now()}`;
    
    // Optimistic update - hiển thị message ngay lập tức
    const optimisticMessage = {
      id: tempId,
      sender: userRole,
      text: content.trim(),
      at: Date.now(),
      optimistic: true
    };
    
    setMessages(prev => ({
      ...prev,
      [peerId]: [...(prev[peerId] || []), optimisticMessage]
    }));
    
    try {
      // Gửi lên server
      console.log("📡 Sending message to server:", { peerId, content });
      const savedMessage = await sendMessage(peerId, content);
      console.log("📡 Server response:", savedMessage);
      console.log("📡 Server message sentAt:", savedMessage.sentAt);
      console.log("📡 Server message sentAt type:", typeof savedMessage.sentAt);
      
      // Parse sentAt carefully
      let messageTimestamp;
      if (savedMessage.sentAt) {
        messageTimestamp = new Date(savedMessage.sentAt).getTime();
        console.log("📡 Parsed timestamp:", messageTimestamp);
        console.log("📡 Is valid timestamp:", !isNaN(messageTimestamp));
      } else {
        messageTimestamp = Date.now();
        console.log("📡 Using fallback timestamp:", messageTimestamp);
      }
      
      // Thay thế optimistic message bằng message thật từ server
      setMessages(prev => ({
        ...prev,
        [peerId]: prev[peerId]?.map(msg => 
          msg.id === tempId ? {
            id: savedMessage._id,
            sender: userRole,
            text: savedMessage.content,
            at: messageTimestamp,
            messageType: savedMessage.messageType,
            attachments: savedMessage.attachments
          } : msg
        ) || []
      }));
      
      // Cập nhật lastMessage trong conversations
      setConversations(prev => prev.map(conv => 
        conv.peerId === peerId ? {
          ...conv,
          lastMessage: {
            content: savedMessage.content,
            sentAt: savedMessage.sentAt,
            sender: savedMessage.sender
          },
          updatedAt: savedMessage.sentAt
        } : conv
      ));
      
    } catch (err) {
      console.error("❌ Error sending message:", err);
      console.error("❌ Error details:", err.message);
      console.error("❌ Error response:", err.response?.data);
      
      // Rollback optimistic update nếu lỗi
      setMessages(prev => ({
        ...prev,
        [peerId]: prev[peerId]?.filter(msg => msg.id !== tempId) || []
      }));
      
      setError("Không thể gửi tin nhắn. Vui lòng thử lại.");
    } finally {
      setSending(false);
    }
  }, [userRole]);

  /**
   * Tìm kiếm conversations
   */
  const searchChats = useCallback(async (query) => {
    if (!query.trim()) {
      await loadConversations();
      return;
    }
    
    try {
      const results = await searchConversations(query);
      
      // Transform kết quả tìm kiếm
      const transformedResults = results.map(conv => ({
        id: conv.peerId,
        peerId: conv.peerId,
        menteeName: `User ${conv.peerId}`,
        menteeAvatar: `https://api.dicebear.com/7.x/initials/svg?seed=${conv.peerId}`,
        lastMessage: conv.lastMessage,
        unread: conv.unreadCount || 0,
        updatedAt: conv.lastMessage?.sentAt || new Date().toISOString()
      }));
      
      setConversations(transformedResults);
    } catch (err) {
      console.error("Error searching conversations:", err);
      setError("Không thể tìm kiếm cuộc trò chuyện");
    }
  }, [loadConversations]);

  // Load conversations khi hook được khởi tạo
  useEffect(() => {
    console.log("🔥 useEffect triggered - calling loadConversations");
    loadConversations();
  }, [loadConversations]);

  // Load messages khi conversation được chọn
  useEffect(() => {
    if (selectedConversationId) {
      loadMessages(selectedConversationId);
    }
  }, [selectedConversationId, loadMessages]);

  return {
    // State
    conversations,
    selectedConversation,
    selectedMessages,
    loading,
    sending,
    error,
    
    // Actions
    selectConversation,
    sendNewMessage: sendNewMessage,
    searchChats,
    loadConversations,
    
    // Computed
    selectedConversationId,
    hasUnreadMessages: conversations.some(conv => conv.unread > 0),
    totalUnreadCount: conversations.reduce((sum, conv) => sum + (conv.unread || 0), 0)
  };
};

export default useChat;
