import jwt from "jsonwebtoken";
import responseHandler from "../handlers/response.handler.js";
import User from "../models/user.model.js";

const tokenDecode = (req) => {
  const auth = req.headers?.authorization || "";
  try {
    const token = auth.toLowerCase().startsWith("bearer ")
      ? auth.split(" ")[1]
      : auth;
    if (!token) return null;
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
};

export const verifyToken = async (req, res, next) => {
  const payload = tokenDecode(req);
  if (!payload) return responseHandler.unauthorized(res);

  const userId = payload?.data || payload?.sub || payload?.id;
  if (!userId) return responseHandler.unauthorized(res);

  try {
    const user = await User.findById(userId).select("-password -__v");
    if (!user) return responseHandler.unauthorized(res);
    req.user = user;
    next();
  } catch {
    return responseHandler.unauthorized(res);
  }
};

export const authorizeRoles = (...allowedRoles) => {
  const allowed = new Set(allowedRoles);
  return (req, res, next) => {
    const user = req.user;
    if (!user) return responseHandler.unauthorized(res, "Authentication required.");

    const roles = Array.isArray(user.roles)
      ? user.roles
      : [user.roles].filter(Boolean);

    const hasAllowedRole = roles.some((r) => allowed.has(r));
    if (hasAllowedRole) return next();

    return responseHandler.forbidden(
      res,
      "You do not have permission to access this resource."
    );
  };
};

export default { verifyToken, authorizeRoles, tokenDecode };
