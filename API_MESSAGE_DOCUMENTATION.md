# Message API Documentation

## API Endpoints cho chức năng tin nhắn

Backend đã có sẵn các API endpoints cho chức năng tin nhắn trong MentorMe. Dưới đây là các endpoint có sẵn:

### Base URL
```
http://localhost:4000/api/v1/messages
```

### Authentication
Tất cả endpoints yêu cầu Bearer token trong header:
```
Authorization: Bearer <your_token>
```

## Endpoints

### 1. Lấy danh sách cuộc trò chuyện
```http
GET /api/v1/messages/conversations
```
**Mô tả:** Lấy danh sách tất cả cuộc trò chuyện của user hiện tại

**Response:**
```json
{
  "items": [
    {
      "peerId": "user_id",
      "unreadCount": 3,
      "lastMessage": {
        "_id": "message_id",
        "sender": "sender_user_id",
        "receiver": "receiver_user_id", 
        "content": "Nội dung tin nhắn cuối",
        "messageType": "text",
        "sentAt": "2025-09-01T10:30:00Z",
        "read": false,
        "status": "sent"
      }
    }
  ]
}
```

### 2. Lấy tin nhắn với một người cụ thể
```http
GET /api/v1/messages?peer=<user_id>&limit=50&cursor=<optional_cursor>
```

**Parameters:**
- `peer` (required): ID của người cần lấy tin nhắn
- `limit` (optional): Số lượng tin nhắn tối đa (default: 50, max: 200)
- `cursor` (optional): Cursor để phân trang

**Response:**
```json
{
  "items": [
    {
      "_id": "message_id",
      "sender": "sender_user_id",
      "receiver": "receiver_user_id",
      "content": "Nội dung tin nhắn",
      "messageType": "text",
      "attachments": [],
      "status": "sent",
      "sentAt": "2025-09-01T10:30:00Z",
      "read": false
    }
  ],
  "nextCursor": "2025-09-01T10:30:00Z_message_id"
}
```

### 3. Gửi tin nhắn mới
```http
POST /api/v1/messages
```

**Body:**
```json
{
  "receiver": "receiver_user_id",
  "content": "Nội dung tin nhắn",
  "messageType": "text",
  "attachments": []
}
```

**messageType values:**
- `text`: Tin nhắn văn bản
- `image`: Tin nhắn hình ảnh
- `file`: Tin nhắn file đính kèm

**Response:**
```json
{
  "_id": "new_message_id",
  "sender": "sender_user_id",
  "receiver": "receiver_user_id",
  "content": "Nội dung tin nhắn",
  "messageType": "text",
  "attachments": [],
  "status": "sent",
  "sentAt": "2025-09-01T10:35:00Z",
  "read": false
}
```

### 4. Đánh dấu tin nhắn đã đọc
```http
POST /api/v1/messages/mark-read
```

**Body:**
```json
{
  "peerId": "peer_user_id"
}
```

**Response:**
```json
{
  "matched": 5,
  "modified": 3
}
```

### 5. Đánh dấu tin nhắn đã giao (delivered)
```http
POST /api/v1/messages/mark-delivered
```

**Body:**
```json
{
  "ids": ["message_id_1", "message_id_2"]
}
```

**Response:**
```json
{
  "matched": 2,
  "modified": 2
}
```

## Lưu ý Implementation

### Frontend Integration
- Đã tạo `messageApi` module trong `frontend/src/api/modules/message.api.js`
- Đã tạo `useChat` hook trong `frontend/src/hooks/useChat.js`
- Đã tạo `MentorMenteeChat` component trong `frontend/src/components/MentorMenteeChat.jsx`
- Đã tích hợp vào mentor profile tại tab "Message"

### Features đã implement
1. ✅ Lấy danh sách conversations
2. ✅ Lấy messages với pagination
3. ✅ Gửi tin nhắn với optimistic UI
4. ✅ Đánh dấu đã đọc
5. ✅ Tìm kiếm conversations
6. ✅ Real-time UI updates
7. ✅ Loading states
8. ✅ Error handling

### Features cần thêm (tùy chọn)
- [ ] WebSocket/SSE cho real-time messaging
- [ ] Upload và gửi file/hình ảnh
- [ ] Emoji picker
- [ ] Message reactions
- [ ] Typing indicators
- [ ] Online status

### Database Schema
Message model đã có trong `backend/src/models/message.model.js`:
```javascript
{
  sender: ObjectId (ref: User),
  receiver: ObjectId (ref: User),
  messageType: String (text|image|file),
  attachments: Array,
  status: String (sent|delivered),
  content: String,
  sentAt: Date,
  read: Boolean
}
```

## Test Instructions

1. Start backend server: `npm run dev` (port 4000)
2. Start frontend server: `npm run dev` (port 3000)
3. Login as mentor
4. Navigate to mentor profile → Message tab
5. Test tất cả chức năng chat

## Error Codes

- `400`: Bad request (invalid data)
- `401`: Unauthorized (no token or invalid token)
- `404`: Not found
- `500`: Internal server error
