<div align="center">
  <img src="frontend/public/favicon.svg" alt="MentorMe logo" width="72" height="72">

# MentorMe

### Guidance that moves you forward.

Nền tảng mentoring full-stack để tìm mentor, đặt lịch tư vấn, học qua khóa học và trao đổi theo thời gian thực.

<p>
  <img alt="React 19" src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=111827">
  <img alt="NestJS 11" src="https://img.shields.io/badge/NestJS-11-E0234E?style=flat-square&logo=nestjs&logoColor=white">
  <img alt="Node.js 22" src="https://img.shields.io/badge/Node.js-22-339933?style=flat-square&logo=nodedotjs&logoColor=white">
  <img alt="MongoDB 8" src="https://img.shields.io/badge/MongoDB-8-47A248?style=flat-square&logo=mongodb&logoColor=white">
  <img alt="Docker" src="https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white">
</p>

<p>
  <a href="https://github.com/kaing615/MentorMe/actions/workflows/backend.yml"><img alt="Backend CI" src="https://github.com/kaing615/MentorMe/actions/workflows/backend.yml/badge.svg"></a>
  <a href="https://github.com/kaing615/MentorMe/actions/workflows/frontend.yml"><img alt="Frontend CI" src="https://github.com/kaing615/MentorMe/actions/workflows/frontend.yml/badge.svg"></a>
</p>
</div>

## Sản phẩm hiện tại

### Mentee

- Đăng ký, xác thực email và đăng nhập bằng JWT.
- Cập nhật hồ sơ cá nhân; đăng ký trở thành mentor bằng dữ liệu hiện có.
- Tìm mentor và khóa học từ dữ liệu backend; lưu mục yêu thích.
- Đặt lịch tư vấn theo availability của mentor.
- Quản lý giỏ hàng, đơn hàng và quyền truy cập khóa học đã mua.
- Nhắn tin, nhận thông báo và gửi đánh giá sau tương tác hợp lệ.

### Mentor

- Quản lý hồ sơ chuyên môn, lịch rảnh và khóa học.
- Chấp nhận, từ chối, hoàn thành hoặc theo dõi booking.
- Xem danh sách mentee đã mua khóa học hoặc có buổi tư vấn.
- Nhắn tin, nhận thông báo và quản lý review.
- Header tự ẩn các hành động chỉ dành cho mentee.

### Nền tảng

- RBAC tự điều hướng theo `role` do backend trả về; màn hình login không yêu cầu chọn role.
- Favorites và notifications dùng dữ liệu thật, không có mock fallback.
- Notification popover có trang “See all”.
- Light/dark mode, giao diện responsive và trợ lý nhanh Mimo.
- Thanh toán VNPay/MoMo có thể bật qua biến môi trường; mặc định bị tắt.

## Kiến trúc

MentorMe hiện là một **modular monolith**:

```text
React 19 + Vite 6
        │ REST / Socket.IO
        ▼
NestJS 11 API ───── Background worker
        │
        ▼
MongoDB 8 replica set
```

| Lớp | Công nghệ |
| --- | --- |
| Frontend | React 19, Vite 6, React Router, Redux Toolkit, TanStack Query, Tailwind CSS, MUI, Ant Design |
| Backend | NestJS 11, TypeScript, Mongoose 8, REST, Swagger |
| Realtime | Socket.IO có xác thực JWT |
| Database | MongoDB 8 replica set; transaction cho booking, payment và review |
| Tích hợp | Cloudinary, Nodemailer/SMTP, VNPay, MoMo |
| Vận hành | Docker Compose, GitHub Actions, health checks, production deployment assets trong `deploy/` |

## Khởi động nhanh bằng Docker

### Yêu cầu

- Docker Desktop có Docker Compose.
- Các cổng `3000`, `4000` và `27017` đang trống.

### 1. Clone và tạo file môi trường

```powershell
git clone https://github.com/kaing615/MentorMe.git
cd MentorMe
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

Trên macOS/Linux, thay `Copy-Item` bằng `cp`.

### 2. Cấu hình tối thiểu

Trong `backend/.env`, thay `JWT_SECRET` bằng một chuỗi dài và ngẫu nhiên. Docker Compose tự ghi đè `MONGO_URL` để kết nối tới Mongo trong container.

> Repository không seed mock account. Đăng ký mentee cần cấu hình `MAIL_HOST`, `MAIL_USER` và `MAIL_PASS` để nhận liên kết xác thực. Tài khoản mentor được tạo từ luồng **Become a mentor** sau khi đăng nhập.

### 3. Chạy ứng dụng

```powershell
docker compose up -d --build
docker compose ps
```

| Dịch vụ | Địa chỉ |
| --- | --- |
| Web app | http://localhost:3000 |
| REST API | http://localhost:4000/api/v1 |
| Swagger UI | http://localhost:4000/api-docs |
| Liveness | http://localhost:4000/health/live |
| Readiness | http://localhost:4000/health/ready |

Xem log hoặc dừng stack:

```powershell
docker compose logs -f backend frontend
docker compose down
```

## Chạy không dùng Docker

Yêu cầu Node.js 22 và một MongoDB replica set truy cập được từ `MONGO_URL`. Mongo standalone không hỗ trợ các transaction mà ứng dụng sử dụng.

```powershell
cd backend
Copy-Item .env.example .env
npm ci
npm run dev
```

Mở terminal khác:

```powershell
cd frontend
Copy-Item .env.example .env
npm ci
npm run dev
```

Frontend Vite chạy tại `http://localhost:5173`. Nếu đổi port hoặc origin, cập nhật `CORS_ORIGINS`, `FRONTEND_URL` và `VITE_API_URL` tương ứng.

## Biến môi trường

File mẫu đầy đủ nằm tại [`backend/.env.example`](backend/.env.example) và [`frontend/.env.example`](frontend/.env.example).

| Nhóm | Biến chính | Ghi chú |
| --- | --- | --- |
| Bắt buộc | `MONGO_URL`, `JWT_SECRET`, `CORS_ORIGINS` | Backend không khởi động nếu thiếu |
| Frontend | `VITE_API_URL` | Mặc định local là `http://localhost:4000/api/v1` |
| Email | `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS` | Cần cho xác thực email và đặt lại mật khẩu |
| Media | `CLOUDINARY_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Cần khi upload avatar/thumbnail |
| VNPay | `VNPAY_ENABLED` và credential `VNPAY_*` | Chỉ bắt buộc khi đặt `VNPAY_ENABLED=true` |
| MoMo | `MOMO_ENABLED` và credential `MOMO_*` | Chỉ bắt buộc khi đặt `MOMO_ENABLED=true` |

Không commit file `.env` hoặc credential thật.

## Kiểm thử

### Backend

Backend test cần MongoDB replica set riêng trên cổng `27018`:

```powershell
cd backend
docker compose -f docker-compose.test.yml up -d --wait
npm ci
npm run typecheck
npm run lint
npm test
npm run build
docker compose -f docker-compose.test.yml down
```

### Frontend

```powershell
cd frontend
npm ci
npm test
npm run typecheck
npm run lint -- --quiet
npm run build
```

## Cấu trúc repository

```text
MentorMe/
├── backend/               NestJS API, worker và test
│   └── src/
│       ├── identity/      Auth và user
│       ├── mentoring/     Profile, availability, booking, review
│       ├── learning/      Course, lesson, enrolment
│       ├── commerce/      Cart, order, payment
│       ├── messaging/     Realtime messaging
│       ├── engagement/    Favorites và notifications
│       └── support/       Help requests
├── frontend/              React application và frontend tests
├── deploy/                Production deployment assets
├── docs/                  System design, diagrams và runbook
├── .github/workflows/     Backend, frontend và delivery CI
└── docker-compose.yml     Local development stack
```

## Xử lý lỗi local thường gặp

- **`Email đã được sử dụng`**: user đã tồn tại trong database; đăng nhập bằng account đó hoặc reset database local.
- **Mongo transaction/replica-set error**: dùng Mongo replica set; Docker Compose đã cấu hình sẵn.
- **Port đã được sử dụng**: dừng service đang chiếm `3000`, `4000` hoặc `27017` trước khi chạy Compose.
- **Payment không khả dụng**: đây là hành vi mặc định khi provider đang tắt hoặc thiếu credential.

Xóa toàn bộ dữ liệu Docker local — thao tác này không thể hoàn tác:

```powershell
docker compose down -v
docker compose up -d --build
```

## Quy trình đóng góp

1. Tạo branch `feat/...`, `fix/...` hoặc `docs/...` từ `main`.
2. Dùng Conventional Commits.
3. Chạy test, typecheck, lint và build liên quan.
4. Push branch và mở pull request vào `main`; không push trực tiếp lên `main`.

```text
feat(booking): add consultation availability workflow
fix(auth): derive post-login route from backend role
docs(readme): refresh local setup guide
```

## Thành viên

- **Nguyễn Đình Tâm** — Trưởng nhóm · DevOps · Backend
- Văn Công Khoa — Backend · Frontend
- Trần Minh Quang — Frontend
- Nguyễn Phước Quý Bảo — Backend · Frontend
- Đỗ Đăng Khoa — Backend · Frontend
- Phạm Đăng Khoa — Frontend
- Huỳnh Lê Đại Thắng — DevOps · Backend
