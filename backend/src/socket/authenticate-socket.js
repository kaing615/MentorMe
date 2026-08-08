import mongoose from "mongoose";
import { verifyAccessToken } from "../modules/identity/access-token.js";

function unauthorized() {
  const error = new Error("Unauthorized");
  error.data = { code: "SOCKET_UNAUTHORIZED" };
  return error;
}

export function createSocketAuthenticator({ jwtAccessSecret }) {
  return function authenticateSocket(socket, next) {
    const authorization = socket.handshake.headers?.authorization;
    const bearerToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
    const token = socket.handshake.auth?.token || bearerToken;

    try {
      if (!token) return next(unauthorized());
      const payload = verifyAccessToken(token, { secret: jwtAccessSecret });
      const userId = String(payload.id || payload.sub || "");
      if (!mongoose.Types.ObjectId.isValid(userId)) return next(unauthorized());
      socket.data.userId = userId;
      socket.data.role = payload.role;
      return next();
    } catch {
      return next(unauthorized());
    }
  };
}

export default createSocketAuthenticator;
