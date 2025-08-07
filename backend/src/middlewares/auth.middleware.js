import jwt from "jsonwebtoken";
import responseHandler from "../handlers/response.handler.js";
import User from "../models/user.model.js";

const tokenDecode = (req) => {
  try {
    const bearerHeader = req.headers.authorization;
    if (bearerHeader) {
      const token = bearerHeader.split(" ")[1];
      return jwt.verify(token, process.env.JWT_SECRET);
    }
    return false;
  } catch {
    return false;
  }
};

// Middleware xác thực token
export const verifyToken = async (req, res, next) => {
  const tokenDecoded = tokenDecode(req);

  if (!tokenDecoded) {
    return responseHandler.unauthorized(res);
  }

  const user = await User.findById(tokenDecoded.data);

  if (!user) {
    return responseHandler.unauthorized(res);
  }

  req.user = user;
  next();
};

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // Assuming user information (including roles) is available in req.user
    const user = req.user; 

    if (!user) {
      return responseHandler.unauthorized(res, "Authentication required.");
    }

    // Check if user has any of the allowed roles
    const hasAllowedRole = allowedRoles.some(role => user.roles.includes(role)); // Assuming user.roles is an array of strings

    if (hasAllowedRole) {
      next(); // User has the required role, proceed to the next middleware/controller
    } else {
      responseHandler.forbidden(res, "You do not have permission to access this resource.");
    }
  };
};

export default {
  verifyToken,
  authorizeRoles,
  tokenDecode,
};
