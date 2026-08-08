import { createHash, randomBytes, randomUUID } from "node:crypto";
import RefreshToken from "../../models/refresh-token.model.js";

export function hashRefreshToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function tokenError(code) {
  const error = new Error(code === "REFRESH_REUSE" ? "Refresh token reuse detected" : "Invalid refresh token");
  error.code = code;
  return error;
}

function mongoRepository(model = RefreshToken) {
  return {
    async create(record) { return model.create(record); },
    async findByHash(tokenHash) { return model.findOne({ tokenHash }).lean(); },
    async consume(tokenHash, usedAt) {
      const result = await model.updateOne(
        { tokenHash, usedAt: null, revokedAt: null, expiresAt: { $gt: usedAt } },
        { $set: { usedAt } }
      );
      return result.modifiedCount === 1;
    },
    async revokeFamily(familyId, revokedAt) {
      await model.updateMany(
        { familyId, revokedAt: null },
        { $set: { revokedAt } }
      );
    },
    async revokeByHash(tokenHash, revokedAt) {
      await model.updateOne(
        { tokenHash, revokedAt: null },
        { $set: { revokedAt } }
      );
    },
  };
}

export function createTokenService({
  repository = mongoRepository(),
  randomToken = () => randomBytes(32).toString("base64url"),
  randomFamilyId = randomUUID,
  clock = () => new Date(),
  refreshLifetimeMs = 30 * 24 * 60 * 60 * 1000,
} = {}) {
  async function issue({ userId, familyId = randomFamilyId(), parentHash }) {
    const token = randomToken();
    const tokenHash = hashRefreshToken(token);
    const now = clock();
    await repository.create({
      tokenHash,
      userId,
      familyId,
      parentHash,
      expiresAt: new Date(now.getTime() + refreshLifetimeMs),
      usedAt: null,
      revokedAt: null,
    });
    return { token, tokenHash, userId: String(userId), familyId };
  }

  return {
    issue,
    async rotate(token) {
      if (!token) throw tokenError("REFRESH_INVALID");
      const tokenHash = hashRefreshToken(token);
      const record = await repository.findByHash(tokenHash);
      const now = clock();
      if (!record) throw tokenError("REFRESH_INVALID");
      if (record.usedAt) {
        await repository.revokeFamily(record.familyId, now);
        throw tokenError("REFRESH_REUSE");
      }
      if (record.revokedAt || new Date(record.expiresAt) <= now) {
        throw tokenError("REFRESH_INVALID");
      }
      const consumed = await repository.consume(tokenHash, now);
      if (!consumed) {
        await repository.revokeFamily(record.familyId, now);
        throw tokenError("REFRESH_REUSE");
      }
      return issue({
        userId: record.userId,
        familyId: record.familyId,
        parentHash: tokenHash,
      });
    },
    async revoke(token) {
      if (!token) return;
      await repository.revokeByHash(hashRefreshToken(token), clock());
    },
  };
}

export const tokenService = createTokenService();

export default tokenService;
