import { Router } from "express";
import * as msg from "../controllers/message.controller.js";
import auth from "../middlewares/token.middleware.js";

const router = Router();

router.post("/", auth, msg.sendMessage);
router.get("/", auth, msg.listMessages);
router.post("/mark-delivered", auth, msg.markMessageAsDelivered);
router.post("/mark-read", auth, msg.markMessagesAsRead);
router.get("/conversations", auth, msg.listConversations);

export default router;