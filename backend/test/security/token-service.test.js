import assert from "node:assert/strict";
import test from "node:test";

function memoryRepository() {
  const records = new Map();
  const revokedFamilies = [];
  return {
    records,
    revokedFamilies,
    async create(record) { records.set(record.tokenHash, { ...record }); return record; },
    async findByHash(tokenHash) { return records.get(tokenHash) || null; },
    async consume(tokenHash, usedAt) {
      const record = records.get(tokenHash);
      if (!record || record.usedAt || record.revokedAt) return false;
      record.usedAt = usedAt;
      return true;
    },
    async revokeFamily(familyId, revokedAt) {
      revokedFamilies.push(familyId);
      for (const record of records.values()) {
        if (record.familyId === familyId) record.revokedAt = revokedAt;
      }
    },
    async revokeByHash(tokenHash, revokedAt) {
      const record = records.get(tokenHash);
      if (record) record.revokedAt = revokedAt;
    },
  };
}

test("refresh rotation stores only hashes and preserves the token family", async () => {
  const module = await import(
    "../../src/modules/identity/token.service.js"
  ).catch(() => ({}));
  assert.equal(typeof module.createTokenService, "function");

  const repository = memoryRepository();
  let sequence = 0;
  const service = module.createTokenService({
    repository,
    randomToken: () => `opaque-${++sequence}`,
    randomFamilyId: () => "family-1",
    clock: () => new Date("2026-01-01T00:00:00.000Z"),
  });
  const issued = await service.issue({ userId: "user-1" });
  assert.equal(issued.token, "opaque-1");
  assert.equal([...repository.records.values()][0].token, undefined);

  const rotated = await service.rotate("opaque-1");
  assert.equal(rotated.token, "opaque-2");
  assert.equal(rotated.userId, "user-1");
  assert.equal(rotated.familyId, issued.familyId);
  assert.equal(repository.records.size, 2);
});

test("refresh token reuse revokes the entire family", async () => {
  const module = await import(
    "../../src/modules/identity/token.service.js"
  );
  const repository = memoryRepository();
  let sequence = 0;
  const service = module.createTokenService({
    repository,
    randomToken: () => `opaque-${++sequence}`,
    randomFamilyId: () => "family-1",
    clock: () => new Date("2026-01-01T00:00:00.000Z"),
  });
  await service.issue({ userId: "user-1" });
  await service.rotate("opaque-1");

  await assert.rejects(
    service.rotate("opaque-1"),
    (error) => error.code === "REFRESH_REUSE"
  );
  assert.deepEqual(repository.revokedFamilies, ["family-1"]);
  assert.ok([...repository.records.values()].every((record) => record.revokedAt));
});
