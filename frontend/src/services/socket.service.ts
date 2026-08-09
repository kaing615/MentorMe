// Socket.IO Service cho real-time messaging
import { io, type Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private listeners = new Map<string, (...args: any[]) => void>();

  // Khởi tạo kết nối socket
  connect(_userId?: string) {
    if (this.socket?.connected) {
      return;
    }

    try {
      const backendURL = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1')
        .replace(/\/api\/v1\/?$/, '');
      const token = (sessionStorage.getItem('actkn') || localStorage.getItem('actkn') || '')
        .replace(/^Bearer\s+/i, '')
        .trim();

      if (!token) return;
      
      this.socket = io(backendURL, {
        auth: { token },
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        timeout: 10000,
        transports: ['websocket', 'polling']
      });

      this.setupEventListeners();
      
    } catch (error) {
      console.error('❌ Socket connection error:', error);
    }
  }

  // Setup các event listeners
  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.isConnected = true;
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔥 Socket connection error:', error.message);
      
      if (error.message.includes('CONNECTION_REFUSED')) {
        console.error('🔥 Backend server không chạy tại http://localhost:4000');
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
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
    }
  }

  // Gửi tin nhắn real-time
  sendMessage(messageData: any) {
    return new Promise<any>((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      
      this.socket.emit('message:send', messageData, (response: any) => {
        if (response?.ok) {
          resolve(response.data);
        } else {
          reject(new Error(response?.error || 'Failed to send message'));
        }
      });
    });
  }

  // Đánh dấu tin nhắn đã đọc
  markAsRead(peerId: string) {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('message:markRead', { peerId }, (response: any) => {
        if (response?.ok) {
          resolve(response);
        } else {
          reject(new Error(response?.error || 'Failed to mark as read'));
        }
      });
    });
  }

  // Đánh dấu tin nhắn đã nhận
  markAsDelivered(messageIds: string[]) {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('message:delivered', { ids: messageIds }, (response: any) => {
        if (response?.ok) {
          resolve(response);
        } else {
          reject(new Error(response?.error || 'Failed to mark as delivered'));
        }
      });
    });
  }

  // Lắng nghe tin nhắn mới
  onNewMessage(callback: (...args: any[]) => void) {
    if (!this.socket) return;
    
    this.socket.on('message:new', callback);
    this.listeners.set('message:new', callback);
  }

  // Lắng nghe khi tin nhắn được đọc
  onMessageRead(callback: (...args: any[]) => void) {
    if (!this.socket) return;
    
    this.socket.on('message:peerRead', callback);
    this.listeners.set('message:peerRead', callback);
  }

  // Lắng nghe khi tin nhắn được nhận
  onMessageDelivered(callback: (...args: any[]) => void) {
    if (!this.socket) return;
    
    this.socket.on('message:delivered', callback);
    this.listeners.set('message:delivered', callback);
  }

  // Hủy lắng nghe một event
  off(eventName: string) {
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
