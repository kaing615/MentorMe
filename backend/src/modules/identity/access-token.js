import jwt from "jsonwebtoken";
import loadEnv from "../../config/env.js";

function accessSecret(secret) {
  return secret || loadEnv(process.env).jwtAccessSecret;
}

export function signAccessToken(payload, { secret, expiresIn = "15m" } = {}) {
  return jwt.sign(payload, accessSecret(secret), { expiresIn });
}

export function verifyAccessToken(token, { secret } = {}) {
  return jwt.verify(token, accessSecret(secret));
}
