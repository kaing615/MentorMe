<div align="center">
  <img src="frontend/public/favicon.svg" alt="MentorMe logo" width="72" height="72">

# MentorMe

### Guidance that moves you forward.

A full-stack mentoring platform for discovering mentors, booking consultations, learning through courses, and communicating in real time.

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

## Current product

### Mentees

- Sign up, verify an email address, and authenticate with JWT.
- Maintain a personal profile and apply to become a mentor using existing profile data.
- Discover backend-powered mentors and courses and save favorites.
- Book consultations from a mentor's published availability.
- Manage a cart, orders, and access to purchased courses.
- Exchange messages, receive notifications, and review eligible interactions.

### Mentors

- Manage a professional profile, availability, and courses.
- Accept, reject, complete, and track bookings.
- See mentees who purchased a course or completed a consultation.
- Exchange messages, receive notifications, and manage reviews.
- Use a role-aware header that hides mentee-only commerce actions.

### Platform

- RBAC redirects users from login using the active `role` returned by the backend; users do not select a role on the login screen.
- Favorites and notifications use real backend data without mock fallbacks.
- Notifications open in a popover with a dedicated “See all” page.
- Responsive light/dark themes and the Mimo quick-help assistant.
- Optional VNPay and MoMo payment providers, disabled by default.

## Architecture

MentorMe currently runs as a **modular monolith**:

```text
React 19 + Vite 6
        │ REST / Socket.IO
        ▼
NestJS 11 API ───── Background worker
        │
        ▼
MongoDB 8 replica set
```

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite 6, React Router, Redux Toolkit, TanStack Query, Tailwind CSS, MUI, Ant Design |
| Backend | NestJS 11, TypeScript, Mongoose 8, REST, Swagger |
| Realtime | Socket.IO authenticated with JWT |
| Database | MongoDB 8 replica set; transactions protect booking, payment, and review flows |
| Integrations | Cloudinary, Nodemailer/SMTP, VNPay, MoMo |
| Operations | Docker Compose, GitHub Actions, health checks, and production deployment assets under `deploy/` |

## Quick start with Docker

### Requirements

- Docker Desktop with Docker Compose.
- Ports `3000`, `4000`, and `27017` available locally.

### 1. Clone and create environment files

```powershell
git clone https://github.com/kaing615/MentorMe.git
cd MentorMe
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

On macOS or Linux, replace `Copy-Item` with `cp`.

### 2. Configure the application

Replace `JWT_SECRET` in `backend/.env` with a long, random value. Docker Compose overrides `MONGO_URL` so the API can reach the Mongo container.

> The repository does not seed mock accounts. Mentee registration requires `MAIL_HOST`, `MAIL_USER`, and `MAIL_PASS` so the user can receive a verification link. Create a mentor account through **Become a mentor** after signing in.

### 3. Start the stack

```powershell
docker compose up -d --build
docker compose ps
```

| Service | Address |
| --- | --- |
| Web app | http://localhost:3000 |
| REST API | http://localhost:4000/api/v1 |
| Swagger UI | http://localhost:4000/api-docs |
| Liveness probe | http://localhost:4000/health/live |
| Readiness probe | http://localhost:4000/health/ready |

Inspect logs or stop the stack:

```powershell
docker compose logs -f backend frontend
docker compose down
```

## Run without Docker

This mode requires Node.js 22 and a MongoDB replica set reachable through `MONGO_URL`. A standalone MongoDB server cannot run the transactions used by the application.

```powershell
cd backend
Copy-Item .env.example .env
npm ci
npm run dev
```

In another terminal:

```powershell
cd frontend
Copy-Item .env.example .env
npm ci
npm run dev
```

The Vite development server runs at `http://localhost:5173`. If ports or origins change, update `CORS_ORIGINS`, `FRONTEND_URL`, and `VITE_API_URL` accordingly.

## Environment variables

Complete templates are available at [`backend/.env.example`](backend/.env.example) and [`frontend/.env.example`](frontend/.env.example).

| Group | Main variables | Notes |
| --- | --- | --- |
| Required | `MONGO_URL`, `JWT_SECRET`, `CORS_ORIGINS` | The backend rejects missing values at startup |
| Frontend | `VITE_API_URL` | Defaults locally to `http://localhost:4000/api/v1` |
| Email | `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS` | Required for email verification and password resets |
| Media | `CLOUDINARY_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Required for avatar and thumbnail uploads |
| VNPay | `VNPAY_ENABLED` and `VNPAY_*` credentials | Credentials are required only when `VNPAY_ENABLED=true` |
| MoMo | `MOMO_ENABLED` and `MOMO_*` credentials | Credentials are required only when `MOMO_ENABLED=true` |

Never commit `.env` files or real credentials.

## Verification

### Backend

Backend tests use a dedicated MongoDB replica set on port `27018`:

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

## Repository structure

```text
MentorMe/
├── backend/               NestJS API, worker, and tests
│   └── src/
│       ├── identity/      Authentication and users
│       ├── mentoring/     Profiles, availability, bookings, and reviews
│       ├── learning/      Courses, lessons, and enrolments
│       ├── commerce/      Cart, orders, and payments
│       ├── messaging/     Realtime messaging
│       ├── engagement/    Favorites and notifications
│       └── support/       Help requests
├── frontend/              React application and frontend tests
├── deploy/                Production deployment assets
├── docs/                  System design, diagrams, and runbooks
├── .github/workflows/     Backend, frontend, and delivery CI
└── docker-compose.yml     Local development stack
```

## Common local issues

- **`Email đã được sử dụng`**: the user already exists in MongoDB; sign in with that account or reset the local database.
- **Mongo transaction or replica-set errors**: use a MongoDB replica set; Docker Compose configures one automatically.
- **Port already in use**: stop the service occupying `3000`, `4000`, or `27017` before starting Compose.
- **Payment unavailable**: this is expected when a provider is disabled or missing credentials.

Delete all local Docker data — this cannot be undone:

```powershell
docker compose down -v
docker compose up -d --build
```

## Contributing

1. Create a `feat/...`, `fix/...`, or `docs/...` branch from `main`.
2. Use Conventional Commits.
3. Run the relevant tests, type checks, lint, and build.
4. Push the branch and open a pull request into `main`; do not push directly to `main`.

```text
feat(booking): add consultation availability workflow
fix(auth): derive post-login route from backend role
docs(readme): refresh local setup guide
```

## Contributors

- **Nguyễn Đình Tâm** — Team lead · DevOps · Backend
- Văn Công Khoa — Backend · Frontend
- Trần Minh Quang — Frontend
- Nguyễn Phước Quý Bảo — Backend · Frontend
- Đỗ Đăng Khoa — Backend · Frontend
- Phạm Đăng Khoa — Frontend
- Huỳnh Lê Đại Thắng — DevOps · Backend
