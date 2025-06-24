## 2. `controllers/`

**Chứa các file controller, chịu trách nhiệm xử lý logic cho từng resource/module (user, booking, review, ...).**

- Mỗi file thường tương ứng một resource chính.
- Nhận request từ router, gọi tới service/model để thao tác dữ liệu, trả về response.

**Ví dụ:**

- `user.controller.js`
- `booking.controller.js`
- `mentor.controller.js`
