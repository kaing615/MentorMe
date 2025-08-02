import express from "express";
import cartController from "../controllers/cart.controller.js";
import tokenMiddleware from "../middlewares/token.middleware.js";

const router = express.Router();

// Tất cả cart routes đều cần authentication
router.use(tokenMiddleware.auth);

// GET /cart - Lấy giỏ hàng
router.get("/", cartController.getCart);

// POST /cart - Thêm khóa học vào giỏ hàng
router.post("/", cartController.addToCart);

// DELETE /cart/:courseId - Xóa khóa học khỏi giỏ hàng
router.delete("/:courseId", cartController.removeFromCart);

// DELETE /cart - Xóa toàn bộ giỏ hàng
router.delete("/", cartController.clearCart);

// GET /cart/check/:courseId - Kiểm tra khóa học có trong giỏ hàng không
router.get("/check/:courseId", cartController.checkInCart);

export default router;
