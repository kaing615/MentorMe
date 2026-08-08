import { Router } from "express";
import { sendMessage, listConversations, listMessages, markMessageAsDelivered, markMessagesAsRead } from "../controllers/message.controller.js";
import tokenMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/", tokenMiddleware.auth, sendMessage);
router.get("/", tokenMiddleware.auth, listMessages);
router.post("/mark-delivered", tokenMiddleware.auth, markMessageAsDelivered);
router.post("/mark-read", tokenMiddleware.auth, markMessagesAsRead);
router.get("/conversations", tokenMiddleware.auth, listConversations);

export default router;
