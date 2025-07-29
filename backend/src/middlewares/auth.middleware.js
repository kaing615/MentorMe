import jwt from "jsonwebtoken";
import responseHandler from "../handlers/response.handler.js";
import User from "../models/user.model.js";

export const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer token

    if (!token) {
      return responseHandler.unauthorized(res, "Token không được cung cấp");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Kiểm tra user còn tồn tại trong database
    const user = await User.findById(decoded.id);
    if (!user) {
      return responseHandler.unauthorized(res, "Người dùng không tồn tại");
    }

    // Kiểm tra user đã verify email chưa
    if (!user.isVerified) {
      return responseHandler.unauthorized(res, "Tài khoản chưa được xác thực");
    }

    req.user = {
      id: user._id,
      email: user.email,
      role: user.role,
      userName: user.userName
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return responseHandler.unauthorized(res, "Token không hợp lệ");
    }
    if (error.name === 'TokenExpiredError') {
      return responseHandler.unauthorized(res, "Token đã hết hạn");
    }
    
    console.error("Auth middleware error:", error);
    return responseHandler.error(res);
  }
};

export const requireMentorRole = (req, res, next) => {
  if (!req.user.role.includes('mentor')) {
    return responseHandler.unauthorized(res, "Bạn không có quyền mentor");
  }
  next();
};

export const requireMenteeRole = (req, res, next) => {
  if (!req.user.role.includes('mentee')) {
    return responseHandler.unauthorized(res, "Bạn không có quyền mentee");
  }
  next();
};

export default {
  verifyToken,
  requireMentorRole,
  requireMenteeRole,
};
