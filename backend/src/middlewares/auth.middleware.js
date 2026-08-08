import responseHandler from "../handlers/response.handler.js";
import User from "../models/user.model.js";
import { verifyAccessToken } from "../modules/identity/access-token.js";

const tokenDecode = (req) => {
  const auth = req.headers?.authorization || "";
  try {
    const token = auth.toLowerCase().startsWith("bearer ")
      ? auth.split(" ")[1]
      : auth;
    if (!token) return null;
    return verifyAccessToken(token);
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
    if (!user || !user.isVerified) return responseHandler.unauthorized(res);
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
    if (!user)
      return responseHandler.unauthorized(res, "Authentication required.");

    const userRole = user.role;
    if (!userRole) {
      return responseHandler.forbidden(res, "No role assigned to user.");
    }

    const hasAllowedRole = allowed.has(userRole);
    if (hasAllowedRole) return next();

    return responseHandler.forbidden(
      res,
      "You do not have permission to access this resource."
    );
  };
};

export const auth = verifyToken;

export default { auth, verifyToken, authorizeRoles, tokenDecode };
