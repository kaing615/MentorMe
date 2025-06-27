## 1. `api/`

Chứa các hàm và file để gọi API backend (axios hoặc fetch).  
Nên tách mỗi resource ra một file (ví dụ: `user.api.js`, `auth.api.js`).

**Ví dụ:**

- `user.api.js` (hàm getUser, updateUser...)
- `auth.api.js` (login, register...)
