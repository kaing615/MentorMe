## 1. `axios/`

**Chứa các file, hàm để gọi API ra ngoài (tới bên thứ ba như VNPAY, Google, Mailgun, ...).**

- Thường sẽ có file cấu hình axios client chung (baseURL, interceptors, headers mặc định).
- Giúp tái sử dụng khi cần gọi nhiều API ngoài ở nhiều controller khác nhau.

**Ví dụ:**

- `axios.client.js` (Cấu hình và export một instance của axios)
