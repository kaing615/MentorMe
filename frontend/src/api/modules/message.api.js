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

/**
 * Lấy danh sách tất cả cuộc trò chuyện của user hiện tại
 * @returns {Promise<{items: Array}>} Danh sách conversations
 */
export const getConversations = async () => {
  try {
    const response = await apiClient.get("/messages/conversations");
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
    const response = await apiClient.get("/messages", {
      params: { peer: peerId, limit, ...(cursor ? { cursor } : {}) },
    });
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
export const sendMessage = async (
  receiverId,
  content,
  messageType = "text",
  attachments = []
) => {
  try {
    const payload = {
      receiver: receiverId,
      content: content.trim(),
      messageType,
      attachments,
    };

    const response = await apiClient.post("/messages", payload);

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
    const response = await apiClient.post("/messages/mark-read", { peerId });

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
    const response = await apiClient.post("/messages/mark-delivered", {
      ids: messageIds,
    });
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
    const response = await getConversations();
    const items = response?.items || response?.data?.items || response || [];

    if (!query.trim()) return items;

    // Ensure items is an array before filtering
    if (!Array.isArray(items)) {
      console.warn("searchConversations: items is not an array:", items);
      return [];
    }

    const searchTerm = query.toLowerCase().trim();

    // Support searching by individual words
    const searchWords = searchTerm
      .split(/\s+/)
      .filter((word) => word.length > 0);

    return items.filter((conversation) => {
      const peerInfo = conversation.peerInfo || {};

      // Create full name for better search
      const firstName = peerInfo.firstName || "";
      const lastName = peerInfo.lastName || "";
      const fullName = `${firstName} ${lastName}`.trim().toLowerCase();
      const userName = (peerInfo.userName || "").toLowerCase();
      const messageContent = (
        conversation.lastMessage?.content || ""
      ).toLowerCase();

      // Create searchable text combining all fields
      const searchableText = [
        conversation.peerId?.toString(),
        messageContent,
        firstName.toLowerCase(),
        lastName.toLowerCase(),
        fullName,
        userName,
        // Also search reversed name order
        `${lastName} ${firstName}`.trim().toLowerCase(),
      ]
        .filter(Boolean)
        .join(" ");

      // Check if all search words are found in the searchable text
      return (
        searchWords.every((word) => searchableText.includes(word)) ||
        searchableText.includes(searchTerm)
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
  searchConversations,
};
