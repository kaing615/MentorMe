<div align="center">

# MentorMe

### Tìm đúng mentor. Tạo đà tiến bộ. Phát triển với sự tự tin.

Nền tảng mentoring full-stack dành cho tìm kiếm mentor, đặt lịch tư vấn, học tập và trao đổi thời gian thực.

<p>
  <a href="README.md">English</a>
  ·
  <strong>Tiếng Việt</strong>
</p>

<p>
  <img alt="React 19" src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=111827">
  <img alt="Node.js 22" src="https://img.shields.io/badge/Node.js-22-339933?style=flat-square&logo=nodedotjs&logoColor=white">
  <img alt="Express 5" src="https://img.shields.io/badge/Express-5-111827?style=flat-square&logo=express&logoColor=white">
  <img alt="MongoDB" src="https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white">
  <img alt="Socket.IO" src="https://img.shields.io/badge/Socket.IO-010101?style=flat-square&logo=socketdotio&logoColor=white">
  <img alt="Docker" src="https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white">
</p>

<p>
  <a href="https://github.com/kaing615/MentorMe/actions/workflows/backend.yml"><img alt="Backend CI" src="https://github.com/kaing615/MentorMe/actions/workflows/backend.yml/badge.svg"></a>
  <a href="https://github.com/kaing615/MentorMe/actions/workflows/frontend.yml"><img alt="Frontend CI" src="https://github.com/kaing615/MentorMe/actions/workflows/frontend.yml/badge.svg"></a>
</p>

[Sản phẩm](#tính-năng-sản-phẩm) · [Kiến trúc](#kiến-trúc-hệ-thống) · [Công nghệ](#công-nghệ-sử-dụng) · [Bắt đầu](#khởi-động-nhanh) · [Tài liệu](#tài-liệu)

</div>

---

## Tổng quan

MentorMe kết nối những phần quan trọng nhất của hành trình mentoring trong một sản phẩm thống nhất. Người học có thể tìm kiếm mentor, yêu cầu lịch tư vấn, mua khóa học, trao đổi tin nhắn và để lại đánh giá. Mentor có thể giới thiệu chuyên môn, quản lý lịch rảnh, phản hồi booking, xuất bản nội dung học tập và liên lạc với mentee.

Bên cạnh tính năng sản phẩm, repository còn thể hiện quá trình phát triển thực tế từ một ứng dụng cộng tác thành hệ thống định hướng production với các quyết định rõ ràng về consistency, scalability, security, reliability, observability và delivery.

> **Trạng thái dự án:** ứng dụng và quy trình production automation đã được triển khai và kiểm chứng local. Dự án chủ động không tuyên bố đã public production hoặc đạt số liệu tải cụ thể cho đến khi hoàn thành các bài kiểm thử hạ tầng bên ngoài.

## Tính năng sản phẩm

| Tìm kiếm và kết nối | Đặt lịch tư vấn |
| --- | --- |
| Tạo hồ sơ mentor hoặc mentee<br>Tìm mentor theo chuyên môn<br>Xem thông tin mentor chi tiết<br>Đăng ký trở thành mentor | Công bố lịch rảnh theo múi giờ<br>Yêu cầu một khung giờ còn trống<br>Xác nhận, từ chối hoặc hủy booking<br>Theo dõi lịch sử tư vấn |
| **Học tập và thanh toán** | **Trao đổi và hỗ trợ** |
| Duyệt khóa học và nội dung chi tiết<br>Quản lý giỏ hàng và wishlist<br>Tạo đơn hàng và các luồng checkout được hỗ trợ<br>Đánh giá khóa học và buổi tư vấn | Nhắn tin thời gian thực có xác thực<br>Theo dõi trạng thái gửi và đã đọc<br>Nhận thông báo trong ứng dụng<br>Gửi và quản lý yêu cầu hỗ trợ |

## Kiến trúc hệ thống

MentorMe sử dụng kiến trúc **scaled modular monolith**. Logic nghiệp vụ được giữ trong một codebase API thống nhất, trong khi các replica stateless, hạ tầng dùng chung và background worker tạo ra hướng mở rộng thực tế mà không đưa microservices vào quá sớm.

<p align="center">
  <img src="docs/diagrams/exports/mentorme-c4.svg" alt="Kiến trúc hệ thống C4 của MentorMe" width="920">
</p>

```text
Trình duyệt
  │
  ▼
Cloudflare Pages / CDN
  │
  ▼
Nginx API gateway và load balancer
  ├── Express API slot A ─┐
  └── Express API slot B ─┼── MongoDB Atlas
                          ├── Redis
                          └── Transactional outbox → RabbitMQ → Worker
```

Bộ tài liệu thiết kế đầy đủ bao gồm source Draw.io có thể chỉnh sửa, sơ đồ C4 và UML, architectural decision records, phân tích consistency và security, quality attributes, chiến lược testing, runbook vận hành và traceability của quá trình triển khai.

## Điểm nổi bật về kỹ thuật

| Thuộc tính | Cách triển khai |
| --- | --- |
| **Consistency** | MongoDB transaction, state machine có guard cho booking/payment, durable idempotency và transactional outbox |
| **Scalability** | Hai API slot stateless, Nginx load balancing, Redis cache versioning, distributed rate limit/lock và Socket.IO fan-out |
| **Reliability** | Publisher confirm, consumer deduplication, bounded retry, dead-letter routing, health gate, graceful shutdown và rollback automation |
| **Security** | Access JWT ngắn hạn, opaque refresh token luân phiên, thu hồi token family khi phát hiện reuse, secure cookie, chặn NoSQL operator và giới hạn upload |
| **Observability** | Structured log, request ID, W3C trace propagation, Prometheus metrics, health endpoint và k6 profile có thể tái lập |
| **Delivery** | GitHub Actions, image bất biến theo Git SHA, protected production approval, rolling update hai slot, smoke test và rollback theo SHA |

## Công nghệ sử dụng

| Lớp | Công nghệ |
| --- | --- |
| **Web application** | React 19, Vite 6, React Router, Redux Toolkit, TanStack Query, MUI, Ant Design, Tailwind CSS |
| **API** | Node.js 22, Express 5, Mongoose 8, REST, Swagger/OpenAPI |
| **Realtime** | Socket.IO, Redis adapter, kết nối WebSocket có xác thực |
| **Dữ liệu và sự kiện** | MongoDB, Redis, RabbitMQ |
| **Hạ tầng** | Docker, Docker Compose, Nginx, Cloudflare Pages/CDN, MongoDB Atlas |
| **Chất lượng và vận hành** | Node test runner, Pino, Prometheus client, k6, actionlint, GitHub Actions, GHCR |

## Khởi động nhanh

### Yêu cầu

- Node.js 22 và npm
- MongoDB local hoặc một MongoDB connection string
- Docker và Docker Compose nếu sử dụng luồng container

Redis và RabbitMQ là tùy chọn khi phát triển local và được tắt mặc định trong file môi trường mẫu.

### Chạy local

1. Clone repository.

   ```bash
   git clone https://github.com/kaing615/MentorMe.git
   cd MentorMe
   ```

2. Cấu hình và khởi động API.

   ```bash
   cd backend
   cp .env.example .env
   npm ci
   npm run dev
   ```

3. Mở terminal khác, cấu hình và khởi động web application.

   ```bash
   cd frontend
   cp .env.example .env
   npm ci
   npm run dev
   ```

Hãy thay các JWT secret và metrics secret mẫu trong `backend/.env` trước khi chạy API. Thông tin xác thực email, media và payment chỉ cần thiết khi sử dụng integration tương ứng.

### Docker Compose

```bash
cp backend/.env.example backend/.env
docker compose up --build
```

| Dịch vụ | Địa chỉ local |
| --- | --- |
| Web application | `http://localhost:5173` — local / `http://localhost:3000` — Docker |
| REST API | `http://localhost:4000` |
| Swagger UI | `http://localhost:4000/api-docs` |
| Liveness probe | `http://localhost:4000/health/live` |

## Cấu trúc repository

```text
MentorMe/
├── backend/                 Express API, domain module, worker và test
├── frontend/                React application và frontend test
├── deploy/                  Production Compose, Nginx, telemetry và script
├── docs/
│   ├── adr/                 Architectural decision records
│   ├── diagrams/            File Draw.io và SVG export
│   └── system-design/       Architecture, security, testing và runbook
├── load-tests/              k6 HTTP và WebSocket profile
├── scripts/                 Kiểm tra tài liệu và diagram
├── tests/deploy/            Test topology và hành vi deployment
├── .github/workflows/       CI và production delivery pipeline
└── docker-compose.yml       Development stack local
```

## Chất lượng và kiểm thử

Chạy các bước kiểm tra chính của CI tại local:

```bash
cd backend
npm test

cd ../frontend
npm test
npm run lint:ci
npm run build

cd ..
node scripts/verify-docs.mjs
node scripts/validate-drawio.mjs
node tests/deploy/compose.test.mjs
node tests/deploy/deploy-script.test.mjs
```

`lint:ci` áp dụng ngưỡng technical debt đã được commit. Bước này ngăn lint regression mới trong khi phần frontend lint debt còn lại được xử lý dần.

## Triển khai production

Các thành phần production nằm trong [`deploy/`](deploy). Delivery workflow build backend image bất biến theo đầy đủ Git SHA, publish lên GHCR, triển khai lần lượt từng API slot, chờ readiness, kiểm tra và reload Nginx, chạy smoke test, sau đó khôi phục SHA trước nếu health gate thất bại.

Làm theo [operations runbook](docs/system-design/operations-runbook.md) để cấu hình host, protected GitHub Environment, deployment secret, quy trình rollback và recovery.

> MentorMe không tuyên bố đã public production hoặc đạt throughput cụ thể cho đến khi các bài kiểm thử hạ tầng trong [portfolio evidence](docs/system-design/portfolio-evidence.md) được thực hiện trên một immutable release.

## Tài liệu

| Chủ đề | Tham khảo |
| --- | --- |
| Tổng quan kiến trúc | [System design overview](docs/system-design/README.md) |
| Kiến trúc production | [Approved production design](docs/system-design/production-system-design.md) |
| Consistency và event | [Event architecture](docs/system-design/consistency-and-events.md) |
| Security | [Security model](docs/system-design/security.md) |
| Testing | [Testing strategy](docs/system-design/testing-strategy.md) |
| Vận hành | [Production runbook](docs/system-design/operations-runbook.md) |
| Claim đã kiểm chứng | [Portfolio evidence](docs/system-design/portfolio-evidence.md) |
| Công việc còn lại | [Known technical debt](docs/system-design/known-debt.md) |

## Quy trình đóng góp

```text
feature/* → stage → main
```

1. Tạo branch riêng cho một feature hoặc fix cụ thể.
2. Sử dụng Conventional Commits cho từng thay đổi logic.
3. Mở pull request vào `stage` để integration test và review.
4. Sau khi kiểm chứng, đưa `stage` vào `main` thông qua pull request được review.
5. Không push trực tiếp lên `main`.

```text
<type>(<scope>): <short description>

feat(booking): add consultation availability workflow
fix(auth): reject refresh token family reuse
docs(architecture): document outbox delivery guarantees
test(payment): cover idempotent checkout retries
```

## Thành viên

| Họ tên | Vai trò |
| --- | --- |
| **Nguyễn Đình Tâm** | Trưởng nhóm · DevOps · Backend |
| Văn Công Khoa | Backend · Frontend |
| Trần Minh Quang | Frontend |
| Nguyễn Phước Quý Bảo | Backend · Frontend |
| Đỗ Đăng Khoa | Backend · Frontend |
| Phạm Đăng Khoa | Frontend |
| Huỳnh Lê Đại Thắng | DevOps · Backend |

---

<p align="center">
  Sản phẩm cộng tác tập trung vào khả năng triển khai thực tế và tư duy thiết kế hệ thống hướng production.
</p>
