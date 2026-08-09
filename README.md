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
- **Backend:** NestJS 11, TypeScript, MongoDB, Socket.IO
- **Realtime chat:** Socket.IO
- **Video call:** WebRTC
- **Auth:** OAuth Google + JWT
- **File Storage:** Cloudinary / AWS S3
- **Email:** MailGun
- **CI/CD:** Docker, GitHub Actions, AWS / DigitalOcean
- **Database:** MongoDB Atlas

---

## ⚡️ Khởi động nhanh dự án

### Clone code về máy

```bash
git clone https://github.com/kaing615/MentorMe/
```

### Chạy bằng Docker Compose

```bash
cp backend/.env.example backend/.env
docker compose up --build
```

### Chạy Local
Nên chạy bằng Docker để đồng bộ
#### Cài đặt backend

```bash
cd backend
cp .env.example .env        # Điền MongoDB, JWT và các provider cần dùng
npm ci
npm run dev
```

#### Cài đặt frontend

```bash
cd frontend 
npm install
npm run dev            
```

### Cấu trúc thư mục

```bash
MentorMe/
├── backend/
│   ├── src/
│   ├── test/
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── public/
│   ├── src/
│   └── Dockerfile
├── docker-compose.yml
├── README.md
└── .gitignore
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

## Chú ý trước khi merge vào main
### Bước 1: Làm tính năng trên nhánh riêng của mình
Code, commit, test tính năng.

Push nhánh đó lên GitHub.

### Bước 2: Merge vào branch dev trước
Tạo Pull Request (PR) từ nhánh feature vào dev.

Test tích hợp trên nhánh dev (có thể deploy lên dev server cho team review/test).

Fix bug, resolve conflict nếu có.

Không làm việc trực tiếp trên dev, chỉ merge từ feature branch vào.

### Bước 3: Khi đã test xong trên dev → Tạo Pull Request từ dev vào main
Chỉ merge dev vào main khi đã test ổn định.

Không được merge thẳng, luôn tạo PR để review lại lần cuối.

### Bước 4: Review kỹ trước khi merge vào main:
Đảm bảo PR đã được duyệt (approve) đủ số người (leader hoặc reviewer).

Check conflict, check CI/CD build pass.

## Commit theo convention sau:
```bash
<loại_commit>(<phạm_vi>): <nội_dung_ngắn_gọn>
```
- <loại_commit>: Loại thay đổi, ví dụ: feat, fix, refactor, docs, test, chore.
- <phạm_vi>: Phần của dự án bị ảnh hưởng (ví dụ: course, user, api, ...).
- <nội_dung_ngắn_gọn>: Diễn giải vắn tắt nội dung commit.
### Một số loại commit thường dùng
- feat: Thêm tính năng mới
- fix: Sửa lỗi
- refactor: Chỉnh sửa code, không thay đổi logic
- docs: Cập nhật tài liệu
- test: Thêm hoặc sửa test
- chore: Các thay đổi lặt vặt khác
### Ví dụ
```bash
feat(course): add getCourses controller with filter and pagination
fix(course): handle bug when filtering by rate
docs: update README with setup instructions
refactor(user): change user model structure
```

## 👥 Contributors :
### Leader : Nguyễn Đình Tâm (DevOps, Backend)
- Văn Công Khoa (Backend, Frontend)
- Trần Minh Quang (Frontend)
- Nguyễn Phước Quý Bảo (Backend, Frontend)
- Đỗ Đăng Khoa (Backend, Frontend)
- Phạm Đăng Khoa (Frontend)
- Huỳnh Lê Đại Thắng (DevOps, Backend)
