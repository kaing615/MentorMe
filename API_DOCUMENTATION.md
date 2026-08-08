# MentorMe API Documentation

## 📋 Tổng quan API Endpoints

### Base URL: `http://localhost:5000/api`

---

## 🔐 User Authentication APIs

### 1. Đăng ký User thông thường

```http
POST /api/user/signup
```

**Mô tả**: Đăng ký tài khoản mentee  
**Access**: Public  
**Body**:

```json
{
  "firstName": "string (required)",
  "lastName": "string (required)",
  "email": "string (required, unique)",
  "password": "string (required, min 6 chars)",
  "confirmPassword": "string (required)",
  "userName": "string (required)"
}
```

**Response**: Thông báo gửi email xác thực

### 2. Đăng ký Mentor

```http
POST /api/user/signupMentor
```

**Mô tả**: Đăng ký tài khoản mentor với thông tin đầy đủ  
**Access**: Public  
**Content-Type**: `multipart/form-data`  
**Body**:

```json
{
  "firstName": "string (required)",
  "lastName": "string (required)",
  "email": "string (required, unique)",
  "password": "string (required, min 6 chars)",
  "confirmPassword": "string (required)",
  "userName": "string (required)",
  "jobTitle": "string (required)",
  "location": "string (required)",
  "category": "string (required)",
  "skills": "array (required)",
  "bio": "string (required)",
  "linkedinUrl": "string (optional)",
  "mentorReason": "string (required)",
  "greatestAchievement": "string (required)"
}
```

**Files**: `avatar` (required)  
**Response**: ID, avatar URL và thông báo thành công

### 3. Đăng nhập

```http
POST /api/user/signin
```

**Mô tả**: Đăng nhập vào hệ thống  
**Access**: Public  
**Body**:

```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Response**: JWT token và thông tin user

### 4. Xác thực Email

```http
GET /api/user/verify?email={email}&verifyKey={verifyKey}
```

**Mô tả**: Xác thực email thông qua link  
**Access**: Public  
**Response**: Xác thực thành công và auto login

### 5. Gửi lại Email xác thực

```http
POST /api/user/resend-verification-email
```

**Mô tả**: Gửi lại email xác thực  
**Access**: Public  
**Body**:

```json
{
  "email": "string (required)"
}
```

### 6. Quên mật khẩu

```http
POST /api/user/forgot-password
```

**Mô tả**: Gửi email reset password  
**Access**: Public  
**Body**:

```json
{
  "email": "string (required)"
}
```

### 7. Reset mật khẩu

```http
POST /api/user/reset-password
```

**Mô tả**: Đặt lại mật khẩu mới  
**Access**: Public  
**Body**:

```json
{
  "email": "string (required)",
  "token": "string (required)",
  "newPassword": "string (required)"
}
```

---

## 👤 Profile Management APIs

### 1. Lấy thông tin Profile

```http
GET /api/profile/
```

**Mô tả**: Lấy thông tin profile của user hiện tại  
**Access**: Private (cần JWT token)  
**Headers**: `Authorization: Bearer {token}`  
**Response**: Thông tin user đầy đủ (đã làm sạch)

### 2. Cập nhật Profile Mentor

```http
PUT /api/profile/mentor
```

**Mô tả**: Cập nhật thông tin mentor  
**Access**: Private (chỉ mentor)  
**Headers**: `Authorization: Bearer {token}`  
**Content-Type**: `multipart/form-data`  
**Body** (tất cả optional):

```json
{
  "userName": "string",
  "firstName": "string",
  "lastName": "string",
  "jobTitle": "string",
  "location": "string",
  "category": "string",
  "skills": "array",
  "bio": "string",
  "linkedinUrl": "string",
  "introVideo": "string",
  "mentorReason": "string",
  "greatestAchievement": "string"
}
```

**Files**: `avatar` (optional)  
**Response**: Thông tin user đã cập nhật

### 3. Cập nhật Profile Mentee

```http
PUT /api/profile/mentee
```

**Mô tả**: Cập nhật thông tin mentee  
**Access**: Private (chỉ mentee)  
**Headers**: `Authorization: Bearer {token}`  
**Content-Type**: `multipart/form-data`  
**Body** (tất cả optional):

```json
{
  "userName": "string",
  "firstName": "string",
  "lastName": "string",
  "bio": "string",
  "location": "string",
  "linkedinUrl": "string"
}
```

**Files**: `avatar` (optional)  
**Response**: Thông tin user đã cập nhật

### 4. Chỉ đổi Avatar

```http
PUT /api/profile/avatar
```

**Mô tả**: Chỉ cập nhật avatar  
**Access**: Private (cần JWT token)  
**Headers**: `Authorization: Bearer {token}`  
**Content-Type**: `multipart/form-data`  
**Files**: `avatar` (required)  
**Response**: URL avatar mới

---

## 🔒 Authentication & Authorization

### JWT Token

- **Header**: `Authorization: Bearer {token}`
- **Expiration**: 7 ngày
- **Payload**: id, role, userName, email

### Roles

- **mentor**: Có thể cập nhật mentor profile
- **mentee**: Có thể cập nhật mentee profile
- **user**: Có thể cập nhật basic profile

---

## 📁 File Upload

### Supported Formats

- **Images**: JPG, JPEG, PNG, GIF
- **Max Size**: Theo cấu hình multer
- **Storage**: Cloudinary

### Upload Fields

- `avatar`: Single file cho ảnh đại diện

---

## ⚠️ Error Responses

### Common HTTP Status Codes

- **200**: OK - Thành công
- **201**: Created - Tạo mới thành công
- **400**: Bad Request - Dữ liệu không hợp lệ
- **401**: Unauthorized - Chưa đăng nhập hoặc token hết hạn
- **403**: Forbidden - Không có quyền truy cập
- **404**: Not Found - Không tìm thấy resource
- **500**: Internal Server Error - Lỗi server

### Error Response Format

```json
{
  "data": {
    "status": 400,
    "message": "Error message here"
  }
}
```

---

## 🧪 Testing

### Postman/Thunder Client

Sử dụng file `test-update-mentor.http` để test các endpoints.

### Environment Variables

```
BASE_URL=http://localhost:5000/api
JWT_TOKEN=your_jwt_token_here
```

---

## 📝 Notes

1. **Skills Format**: Khi gửi qua form-data, skills phải là JSON string: `["JavaScript", "Node.js"]`
2. **Security**: Tất cả sensitive data đã được làm sạch trước khi trả về
3. **File Upload**: Sử dụng Cloudinary để lưu trữ và quản lý ảnh
4. **Validation**: Tất cả endpoints đều có validation middleware
5. **Rate Limiting**: Chưa implement, cần thêm nếu cần thiết
