import responseHandler from "../../handlers/response.handler.js";
import User from "../../models/user.model.js";
import { signAccessToken } from "./access-token.js";
import tokenService from "./token.service.js";

export const REFRESH_COOKIE = "mentorme_refresh";

function refreshCookieOptions({ includeMaxAge = true } = {}) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "lax",
    path: "/api/v1/user",
    ...(includeMaxAge ? { maxAge: 30 * 24 * 60 * 60 * 1000 } : {}),
  };
}

const userRepository = {
  async findSafeById(userId) {
    return User.findById(userId)
      .select("-password -salt -verifyKey -resetToken -resetTokenExpires -__v")
      .lean();
  },
};

export function createSessionController({
  tokens = tokenService,
  users = userRepository,
  signAccess = signAccessToken,
} = {}) {
  async function startSession(user, response) {
    const userId = String(user._id || user.id);
    const refresh = await tokens.issue({ userId });
    const accessToken = signAccess(
      { id: userId, role: user.role },
      { expiresIn: "15m" }
    );
    response.cookie(
      REFRESH_COOKIE,
      refresh.token,
      refreshCookieOptions()
    );
    return accessToken;
  }

  return {
    startSession,
    async refresh(request, response) {
      try {
        const rotated = await tokens.rotate(request.cookies?.[REFRESH_COOKIE]);
        const user = await users.findSafeById(rotated.userId);
        if (!user) return responseHandler.unauthorized(response);
        const token = signAccess(
          { id: String(user._id), role: user.role },
          { expiresIn: "15m" }
        );
        response.cookie(
          REFRESH_COOKIE,
          rotated.token,
          refreshCookieOptions()
        );
        return responseHandler.ok(response, { token, user });
      } catch {
        response.clearCookie(
          REFRESH_COOKIE,
          refreshCookieOptions({ includeMaxAge: false })
        );
        return responseHandler.unauthorized(response, "Session expired.");
      }
    },
    async logout(request, response) {
      await tokens.revoke(request.cookies?.[REFRESH_COOKIE]);
      response.clearCookie(
        REFRESH_COOKIE,
        refreshCookieOptions({ includeMaxAge: false })
      );
      return response.status(204).end();
    },
  };
}

export const sessionController = createSessionController();

export default sessionController;
