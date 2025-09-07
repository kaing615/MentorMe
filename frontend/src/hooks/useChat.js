// Custom Hook for Chat functionality
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { 
  getConversations, 
  getMessages, 
  sendMessage, 
  markMessagesAsRead,
  searchConversations 
} from "../api/modules/message.api.js";
import socketService from "../services/socket.service.js";

// Hook chính cho chat functionality
export const useChat = (userRole = 'mentor') => {
  // State management
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [messages, setMessages] = useState({}); // Object với key là conversationId
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  // Ref để tránh stale closure
  const selectedConversationIdRef = useRef(selectedConversationId);
  selectedConversationIdRef.current = selectedConversationId;

  // Initialize WebSocket connection
  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = currentUser._id || currentUser.id;
    
    if (userId) {
      console.log("🔌 Initializing socket connection for user:", userId);
      socketService.connect(userId);
      
      // Check connection status
      const checkConnection = () => {
        setIsSocketConnected(socketService.isSocketConnected());
      };
      
      checkConnection();
      const interval = setInterval(checkConnection, 1000);
      
      return () => {
        clearInterval(interval);
        socketService.off('message:new');
        socketService.off('message:peerRead');
        socketService.off('message:delivered');
      };
    }
  }, []);

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
      
      // Không tự động chọn conversation nào - user phải click để chọn
      
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
        
        // Lấy thông tin user hiện tại từ localStorage
        const currentUserStr = localStorage.getItem("user");
        let currentUserId = null;
        try {
          const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
          currentUserId = currentUser?._id || currentUser?.id;
        } catch (e) {
          console.error("Error parsing current user:", e);
        }
        
        // Xác định sender: nếu message.sender === currentUserId thì là từ user hiện tại
        const isFromCurrentUser = msg.sender === currentUserId;
        
        return {
          id: msg._id,
          sender: isFromCurrentUser ? userRole : (userRole === 'mentor' ? 'mentee' : 'mentor'),
          text: msg.content,
          at: new Date(msg.sentAt).getTime(),
          messageType: msg.messageType,
          attachments: msg.attachments,
          read: msg.read,
          isFromCurrentUser: isFromCurrentUser // Thêm field này để dễ kiểm tra
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
   * Gửi tin nhắn mới qua WebSocket
   */
  const sendNewMessage = useCallback(async (peerId, content) => {
    if (!peerId || !content.trim() || sending) {
      console.log("❌ Cannot send message:", { peerId: !!peerId, content: !!content.trim(), sending });
      return;
    }
    
    setSending(true);
    const tempId = `temp-${Date.now()}`;
    
    // Lấy thông tin user hiện tại từ localStorage
    const currentUserStr = localStorage.getItem("user");
    let currentUserId = null;
    try {
      const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
      currentUserId = currentUser?._id || currentUser?.id;
    } catch (e) {
      console.error("Error parsing current user:", e);
    }
    
    // Optimistic update - hiển thị message ngay lập tức
    const optimisticMessage = {
      id: tempId,
      sender: userRole,
      text: content.trim(),
      at: Date.now(),
      optimistic: true,
      isFromCurrentUser: true // Luôn true cho optimistic message
    };
    
    console.log("🔮 Adding optimistic message:", optimisticMessage);
    
    setMessages(prev => ({
      ...prev,
      [peerId]: [...(prev[peerId] || []), optimisticMessage]
    }));
    
    try {
      // Gửi qua WebSocket thay vì HTTP API
      console.log("� Sending message via WebSocket:", { peerId, content });
      
      if (socketService.isSocketConnected()) {
        console.log("🚀 Attempting to send via WebSocket...");
        
        try {
          const savedMessage = await socketService.sendMessage({
            receiver: peerId,
            messageType: 'text',
            content: content.trim()
          });
          
          console.log("✅ WebSocket message sent successfully:", savedMessage);
          
          // Validate savedMessage structure
          if (!savedMessage || !savedMessage._id) {
            throw new Error("Invalid response from server - missing message data");
          }
          
          // Parse sentAt carefully
          let messageTimestamp;
          if (savedMessage.sentAt) {
            messageTimestamp = new Date(savedMessage.sentAt).getTime();
          } else {
            messageTimestamp = Date.now();
          }
          
          // Xác định sender cho saved message
          const isFromCurrentUser = savedMessage.sender === currentUserId;
          
          // Thay thế optimistic message bằng message thật từ server
          console.log("🔄 Replacing optimistic message with server message:", {
            tempId,
            savedMessage: savedMessage._id,
            content: savedMessage.content
          });
          
          setMessages(prev => ({
            ...prev,
            [peerId]: prev[peerId]?.map(msg => 
              msg.id === tempId ? {
                id: savedMessage._id,
                sender: isFromCurrentUser ? userRole : (userRole === 'mentor' ? 'mentee' : 'mentor'),
                text: savedMessage.content,
                at: messageTimestamp,
                messageType: savedMessage.messageType,
                attachments: savedMessage.attachments,
                isFromCurrentUser: isFromCurrentUser
              } : msg
            ) || []
          }));
          
          // Cập nhật lastMessage trong conversations (chỉ khi có đầy đủ dữ liệu)
          if (savedMessage.content && savedMessage.sentAt) {
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
          }
          
        } catch (socketError) {
          console.error("❌ WebSocket send error:", socketError);
          throw new Error(`WebSocket error: ${socketError.message}`);
        }
        
      } else {
        // Nếu socket không kết nối, báo lỗi
        throw new Error("Kết nối thời gian thực bị gián đoạn. Vui lòng tải lại trang.");
      }
      
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

  // Auto-refresh đã được thay thế bằng WebSocket real-time messaging
  // Không cần thiết auto-refresh nữa vì tin nhắn được cập nhật real-time qua socket
  /*
  useEffect(() => {
    const intervalId = setInterval(() => {
      // Chỉ refresh nếu không đang gửi tin nhắn và không đang loading để tránh xung đột
      if (!sending && !loading) {
        console.log("🔄 Auto-refreshing conversations and messages...");
        
        // Reload conversations để cập nhật lastMessage và unread count
        loadConversations();
        
        // Reload messages cho conversation hiện tại nếu có
        if (selectedConversationIdRef.current) {
          console.log("🔄 Auto-refreshing messages for:", selectedConversationIdRef.current);
          loadMessages(selectedConversationIdRef.current);
        }
      }
    }, 3000); // 3 seconds - tối ưu cho browser, tránh lag giao diện

    return () => {
      console.log("🔄 Clearing auto-refresh interval");
      clearInterval(intervalId);
    };
  }, [sending, loading]); // Thêm loading vào dependency để re-create interval khi loading thay đổi
  */

  /**
   * Đánh dấu tin nhắn đã đọc qua WebSocket
   */
  const markConversationAsRead = useCallback(async (peerId) => {
    if (!peerId) return;
    
    try {
      if (socketService.isSocketConnected()) {
        await socketService.markAsRead(peerId);
        console.log("✅ Marked messages as read via WebSocket for peer:", peerId);
      } else {
        // Fallback to HTTP API
        await markMessagesAsRead(peerId);
        console.log("✅ Marked messages as read via HTTP API for peer:", peerId);
      }
      
      // Refresh conversations để cập nhật unread count
      loadConversations();
    } catch (error) {
      console.error("❌ Error marking messages as read:", error);
    }
  }, [loadConversations]);

  // Setup lại socket listeners sau khi tất cả functions đã được định nghĩa
  useEffect(() => {
    if (socketService.isSocketConnected()) {
      // Cleanup previous listeners
      socketService.off('message:new');
      socketService.off('message:peerRead');
      socketService.off('message:delivered');
      
      // Setup new listeners với proper functions
      socketService.onNewMessage((newMessage) => {
        console.log("📨 Received new message via socket:", newMessage);
        
        const senderId = newMessage.sender;
        const receiverId = newMessage.receiver;
        const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
        const currentUserId = currentUser._id || currentUser.id;
        
        // CHỈ xử lý tin nhắn từ người khác, không xử lý tin nhắn của chính mình
        // Vì tin nhắn của mình đã được xử lý qua optimistic update + WebSocket response
        if (senderId === currentUserId) {
          console.log("🚫 Ignoring own message from socket event to avoid duplicate");
          return;
        }
        
        // Xác định peerId (người gửi tin nhắn)
        const peerId = senderId;
        
        // Transform message để match với UI format
        const transformedMessage = {
          id: newMessage._id,
          sender: userRole === 'mentor' ? 'mentee' : 'mentor', // Người gửi là role ngược lại
          text: newMessage.content || '', // Đảm bảo không undefined
          at: new Date(newMessage.sentAt).getTime(),
          messageType: newMessage.messageType,
          attachments: newMessage.attachments,
          isFromCurrentUser: false // Luôn false vì là tin nhắn từ người khác
        };
        
        console.log("📥 Adding incoming message:", transformedMessage);
        
        // Chỉ thêm message nếu có nội dung
        if (!transformedMessage.text.trim() && (!transformedMessage.attachments || transformedMessage.attachments.length === 0)) {
          console.log("🚫 Skipping empty message");
          return;
        }
        
        // Cập nhật messages state - kiểm tra duplicate trước khi thêm
        setMessages(prev => {
          const currentMessages = prev[peerId] || [];
          
          // Kiểm tra xem message đã tồn tại chưa (theo _id)
          const messageExists = currentMessages.some(msg => msg.id === transformedMessage.id);
          
          if (messageExists) {
            console.log("🚫 Message already exists, skipping duplicate:", transformedMessage.id);
            return prev;
          }
          
          return {
            ...prev,
            [peerId]: [...currentMessages, transformedMessage].sort((a, b) => a.at - b.at)
          };
        });
        
        // Chỉ refresh conversations nếu tin nhắn không phải từ current user
        if (senderId !== currentUserId) {
          setTimeout(() => {
            loadConversations();
          }, 500);
        }
      });

      socketService.onMessageRead((data) => {
        console.log("👁 Message read notification:", data);
      });

      socketService.onMessageDelivered((data) => {
        console.log("✅ Message delivered notification:", data);
      });
    }
  }, [isSocketConnected, loadConversations]);

  return {
    // State
    conversations,
    selectedConversation,
    selectedMessages,
    loading,
    sending,
    error,
    isSocketConnected,
    
    // Actions
    selectConversation,
    sendNewMessage: sendNewMessage,
    searchChats,
    loadConversations,
    markConversationAsRead,
    
    // Computed
    selectedConversationId,
    hasUnreadMessages: conversations.some(conv => conv.unread > 0),
    totalUnreadCount: conversations.reduce((sum, conv) => sum + (conv.unread || 0), 0)
  };
};

export default useChat;
