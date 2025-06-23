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
```

### 3. Cài đặt frontend

```bash
cd frontend 
npm install
```

### 4. Chạy bằng Docker Compose

```bash
docker-compose up --build
```

### Cấu trúc thư mục

```bash
MentorMe/
├── backend/
│   ├── public/
│   ├── src/
│   ├── .env
│   └── Dockerfile
├── frontend/
│   ├── public/
│   ├── src/
│   └── Dockerfile
├── docker-compose.yml
├── README.md
└── .gitignore
└── README.md
```

---

## Chú ý workflow

### 1. Tạo nhánh riêng cho mỗi người

Ví dụ:

#### Tạo nhánh

```bash
git checkout main
git pull origin main
git checkout -b feature/tam-auth
```

#### Commit

```bash
git add .
git commit -m "Add login API"
git push -u origin feature/tam-auth
```

### 2. Khi hoàn thành 1 phần, lên GitHub tạo Pull Request (PR) từ nhánh feature/tam-auth về main

Những người khác (hoặc leader) review, góp ý, đồng ý thì mới merge vào main.

### 3. Lưu ý khi Merge

Nếu nhiều bạn cùng sửa chung 1 file, sẽ dễ bị merge conflict. Nên trao đổi rõ ai làm phần nào, hoặc tách rõ folder/module.

### 4. Đặt tên nhánh

feature/tennguoi-chucnang hoặc tennguoi-chucnang (dễ nhớ, đồng bộ là được).

## Tóm lại

- **KHÔNG push thẳng lên main.**

- **NÊN mỗi bạn 1 nhánh riêng, hoặc mỗi tính năng 1 nhánh.**

- **Tạo PR, review rồi merge vào main.**
