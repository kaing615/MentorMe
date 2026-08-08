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
    if (!user)
      return responseHandler.unauthorized(res, "Authentication required.");

    console.log("User object:", user);
    console.log("User role:", user.role);
    console.log("Allowed roles:", allowedRoles);

    // User model has 'role' field (singular), not 'roles'
    const userRole = user.role;
    if (!userRole) {
      console.log("No role found for user");
      return responseHandler.forbidden(res, "No role assigned to user.");
    }

    const hasAllowedRole = allowed.has(userRole);
    console.log("Has allowed role:", hasAllowedRole);

    if (hasAllowedRole) return next();

    return responseHandler.forbidden(
      res,
      "You do not have permission to access this resource."
    );
  };
};

export default { verifyToken, authorizeRoles, tokenDecode };
