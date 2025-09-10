## 4. `middlewares/`

**Chứa các middleware cho Express (kiểm tra xác thực JWT, phân quyền, log, bắt lỗi toàn cục, ...).**

- Dùng cho logic trung gian chạy trước khi controller được gọi.
- Viết chuẩn middleware của ExpressJS.

**Ví dụ:**

- `auth.middleware.js`
- `role.middleware.js`
- `error.middleware.js`
