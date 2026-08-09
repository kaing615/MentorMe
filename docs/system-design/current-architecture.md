# Current Architecture

**Implementation status:** Current

At baseline commit `431fc09`, MentorMe is a React/Vite SPA plus one Express 5 and Socket.IO process. Controllers access Mongoose models directly. MongoDB may run locally through the development Compose file. Email, Cloudinary, and payment providers are called synchronously from application code.

The repository has build-only GitHub Actions, permissive HTTP/Socket.IO CORS, a seven-day bearer JWT, no refresh-token rotation, and duplicate authentication middleware. It has no automated backend test command, Redis, RabbitMQ, Nginx gateway, distributed rate limiting, shared Socket.IO adapter, production metrics, or CD.

The frontend production build succeeds on Windows but starts with a 1.52 MB main JavaScript chunk. Fresh dependency installation reports high-severity advisories in both packages. These are baseline observations, not target claims.
