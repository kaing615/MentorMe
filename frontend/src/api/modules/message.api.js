/**
 * API Module for Message/Chat functionality
 * 
 * Tích hợp với backend MentorMe để xử lý tin nhắn giữa mentor và mentee
 * 
 * Endpoints:
 * - GET /api/v1/messages/conversations - Lấy danh sách cuộc trò chuyện
 * - GET /api/v1/messages?peer=userId - Lấy tin nhắn với một người cụ thể
 * - POST /api/v1/messages - Gửi tin nhắn mới
 * - POST /api/v1/messages/mark-read - Đánh dấu tin nhắn đã đọc
 */

import { apiClient } from "../clients/api.client.js";
import axios from "axios";

/**
 * Lấy danh sách tất cả cuộc trò chuyện của user hiện tại
 * @returns {Promise<{items: Array}>} Danh sách conversations
 */
export const getConversations = async () => {
  try {
    // Temporarily bypass apiClient to test
    const token = sessionStorage.getItem("actkn") || localStorage.getItem("actkn");
    const cleanToken = token?.replace(/^Bearer\s+/i, "")?.replace(/^"|"$/g, "");
    
    const response = await axios.get("http://localhost:4000/api/v1/messages/conversations", {
      headers: {
        'Authorization': `Bearer ${cleanToken}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    console.log("✅ Direct axios call successful:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Direct axios call failed:", error);
    console.error("❌ Error response:", error.response?.data);
    console.error("❌ Error status:", error.response?.status);
    throw error;
  }
};

/**
 * Lấy tin nhắn giữa user hiện tại và một peer cụ thể
 * @param {string} peerId - ID của người cần lấy tin nhắn
 * @param {number} limit - Số lượng tin nhắn tối đa (default: 50)
 * @param {string} cursor - Cursor để phân trang (optional)
 * @returns {Promise<{items: Array, nextCursor: string}>} Tin nhắn và cursor tiếp theo
 */
export const getMessages = async (peerId, limit = 50, cursor = null) => {
  try {
    // Temporarily bypass apiClient for getMessages too
    const token = sessionStorage.getItem("actkn") || localStorage.getItem("actkn");
    const cleanToken = token?.replace(/^Bearer\s+/i, "")?.replace(/^"|"$/g, "");
    
    // Build URL with query params manually
    let url = `http://localhost:4000/api/v1/messages?peer=${peerId}&limit=${limit}`;
    if (cursor) {
      url += `&cursor=${encodeURIComponent(cursor)}`;
    }
    
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${cleanToken}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    console.log("✅ Direct getMessages call successful:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Direct getMessages call failed:", error);
    console.error("❌ Error response:", error.response?.data);
    console.error("❌ Error status:", error.response?.status);
    throw error;
  }
};

/**
 * Gửi tin nhắn mới
 * @param {string} receiverId - ID người nhận
 * @param {string} content - Nội dung tin nhắn
 * @param {string} messageType - Loại tin nhắn (text, image, file)
 * @param {Array} attachments - Mảng file đính kèm (optional)
 * @returns {Promise<Object>} Tin nhắn đã được tạo
 */
export const sendMessage = async (receiverId, content, messageType = "text", attachments = []) => {
  try {
    // Temporarily bypass apiClient for sendMessage too
    const token = sessionStorage.getItem("actkn") || localStorage.getItem("actkn");
    const cleanToken = token?.replace(/^Bearer\s+/i, "")?.replace(/^"|"$/g, "");
    
    const payload = {
      receiver: receiverId,
      content: content.trim(),
      messageType,
      attachments
    };
    
    const response = await axios.post("http://localhost:4000/api/v1/messages", payload, {
      headers: {
        'Authorization': `Bearer ${cleanToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log("✅ Direct sendMessage call successful:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Direct sendMessage call failed:", error);
    console.error("❌ Error response:", error.response?.data);
    throw error;
  }
};

/**
 * Đánh dấu tất cả tin nhắn từ một peer đã được đọc
 * @param {string} peerId - ID của người gửi
 * @returns {Promise<Object>} Kết quả cập nhật
 */
export const markMessagesAsRead = async (peerId) => {
  try {
    // Temporarily bypass apiClient for markMessagesAsRead too
    const token = sessionStorage.getItem("actkn") || localStorage.getItem("actkn");
    const cleanToken = token?.replace(/^Bearer\s+/i, "")?.replace(/^"|"$/g, "");
    
    const response = await axios.post("http://localhost:4000/api/v1/messages/mark-read", 
      { peerId }, 
      {
        headers: {
          'Authorization': `Bearer ${cleanToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log("✅ Direct markMessagesAsRead call successful:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Direct markMessagesAsRead call failed:", error);
    console.error("❌ Error response:", error.response?.data);
    throw error;
  }
};

/**
 * Đánh dấu tin nhắn đã được giao (delivered)
 * @param {Array<string>} messageIds - Mảng ID tin nhắn cần đánh dấu
 * @returns {Promise<Object>} Kết quả cập nhật
 */
export const markMessagesAsDelivered = async (messageIds) => {
  try {
    const response = await apiClient.post("/messages/mark-delivered", { ids: messageIds });
    return response.data;
  } catch (error) {
    console.error("[API] Error marking messages as delivered:", error);
    throw error;
  }
};

/**
 * Tìm kiếm cuộc trò chuyện theo tên user
 * @param {string} query - Từ khóa tìm kiếm
 * @returns {Promise<Array>} Danh sách cuộc trò chuyện phù hợp
 */
export const searchConversations = async (query) => {
  try {
    // Tạm thời sử dụng getConversations và filter phía client
    // Có thể mở rộng backend để support search query
    const { items } = await getConversations();
    
    if (!query.trim()) return items;
    
    const searchTerm = query.toLowerCase().trim();
    return items.filter(conversation => {
      // Giả sử trong tương lai backend sẽ populate thông tin user
      // Hiện tại filter dựa trên peerId hoặc lastMessage content
      return (
        conversation.peerId?.toString().includes(searchTerm) ||
        conversation.lastMessage?.content?.toLowerCase().includes(searchTerm)
      );
    });
  } catch (error) {
    console.error("[API] Error searching conversations:", error);
    throw error;
  }
};

export default {
  getConversations,
  getMessages,
  sendMessage,
  markMessagesAsRead,
  markMessagesAsDelivered,
  searchConversations
};
