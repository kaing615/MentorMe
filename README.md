# MentorMe

> Nền tảng kết nối mentor và mentee, giúp sinh viên, học sinh dễ dàng tìm kiếm, đặt lịch hẹn tư vấn, trò chuyện và phát triển cá nhân cùng chuyên gia.

---

## 🚀 Tính năng chính

- Đăng ký / Đăng nhập (OAuth Google, JWT)
- Quản lý hồ sơ mentor & mentee (bio, avatar, chuyên môn, lịch rảnh)
- Tìm kiếm mentor theo lĩnh vực/chuyên môn
- Đặt lịch hẹn tư vấn (online/offline)
- Chat trực tuyến giữa mentor - mentee (sau khi đặt lịch thành công)
- Video call qua WebRTC
- Gửi, nhận tài liệu
- Đánh giá, review mentor
- Thông báo nhắc lịch, xác nhận, nhắc đánh giá
- Quản lý lịch hẹn cá nhân

---

## 🏗️ Công nghệ sử dụng

- **Frontend:** ReactJS, Vite, MUI
- **Backend:** NodeJS, ExpressJS, MongoDB, Socket.IO
- **Realtime chat:** Socket.IO
- **Video call:** WebRTC
- **Auth:** OAuth Google + JWT
- **File Storage:** Cloudinary / AWS S3
- **Email:** MailGun
- **CI/CD:** Docker, GitHub Actions, AWS / DigitalOcean
- **Database:** MongoDB Atlas

---

## ⚡️ Khởi động nhanh dự án

### 1. Clone code về máy

```bash
git clone https://github.com/kaing615/MentorMe/
```

### 2. Cài đặt backend
```bash
cd backend
cp .env.example .env        # Tạo file .env và điền biến môi trường (MongoDB, JWT, PORT)
npm install
npm run start                 
```

### 3. Cài đặt frontend
```bash
cd backend
cp .env.example .env        # Tạo file .env và điền biến môi trường (MongoDB, JWT, PORT)
npm install
npm run dev                 
```

### 4. Chạy bằng Docker Compose (tùy chọn)
```bash
docker-compose up --build
```

### Cấu trúc thư mục
```bash
MentorMe/
├── backend/
│   ├── src/
│   ├── .env
│   └── Dockerfile
├── frontend/
│   ├── src/
│   └── Dockerfile
├── docker-compose.yml
├── README.md
└── .gitignore
```

