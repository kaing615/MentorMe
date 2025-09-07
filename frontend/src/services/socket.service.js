// Socket.IO Service cho real-time messaging
import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
  }

  // Khởi tạo kết nối socket
  connect(userId) {
    if (this.socket?.connected) {
      console.log('🔌 Socket already connected');
      return;
    }

    try {
      const backendURL = 'http://localhost:4000';
      
      this.socket = io(backendURL, {
        auth: {
          userId: userId
        },
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        timeout: 10000,
        transports: ['websocket', 'polling']
      });

      this.setupEventListeners();
      
      console.log('🚀 Socket connecting...', { userId, backendURL });
    } catch (error) {
      console.error('❌ Socket connection error:', error);
    }
  }

  // Setup các event listeners
  setupEventListeners() {
    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log('✅ Socket connected:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.log('❌ Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔥 Socket connection error:', error.message);
      
      if (error.message.includes('CONNECTION_REFUSED')) {
        console.error('🔥 Backend server không chạy tại http://localhost:4000');
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('🔄 Socket reconnection failed:', error.message);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('🔄 Socket reconnection failed permanently');
    });
  }

  // Ngắt kết nối socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
      console.log('🔌 Socket disconnected manually');
    }
  }

  // Gửi tin nhắn real-time
  sendMessage(messageData) {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      console.log("🔥 Sending message via socket:", messageData);
      
      this.socket.emit('message:send', messageData, (response) => {
        console.log("🔥 Socket response:", response);
        if (response?.ok) {
          resolve(response.data);
        } else {
          reject(new Error(response?.error || 'Failed to send message'));
        }
      });
    });
  }

  // Đánh dấu tin nhắn đã đọc
  markAsRead(peerId) {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('message:markRead', { peerId }, (response) => {
        if (response?.ok) {
          resolve(response);
        } else {
          reject(new Error(response?.error || 'Failed to mark as read'));
        }
      });
    });
  }

  // Đánh dấu tin nhắn đã nhận
  markAsDelivered(messageIds) {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('message:delivered', { ids: messageIds }, (response) => {
        if (response?.ok) {
          resolve(response);
        } else {
          reject(new Error(response?.error || 'Failed to mark as delivered'));
        }
      });
    });
  }

  // Lắng nghe tin nhắn mới
  onNewMessage(callback) {
    if (!this.socket) return;
    
    this.socket.on('message:new', callback);
    this.listeners.set('message:new', callback);
  }

  // Lắng nghe khi tin nhắn được đọc
  onMessageRead(callback) {
    if (!this.socket) return;
    
    this.socket.on('message:peerRead', callback);
    this.listeners.set('message:peerRead', callback);
  }

  // Lắng nghe khi tin nhắn được nhận
  onMessageDelivered(callback) {
    if (!this.socket) return;
    
    this.socket.on('message:delivered', callback);
    this.listeners.set('message:delivered', callback);
  }

  // Hủy lắng nghe một event
  off(eventName) {
    if (this.socket && this.listeners.has(eventName)) {
      this.socket.off(eventName, this.listeners.get(eventName));
      this.listeners.delete(eventName);
    }
  }

  // Kiểm tra trạng thái kết nối
  isSocketConnected() {
    return this.socket?.connected || false;
  }

  // Lấy socket instance
  getSocket() {
    return this.socket;
  }
}

// Export singleton instance
export default new SocketService();
