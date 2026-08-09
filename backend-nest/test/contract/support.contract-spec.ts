import type { ChildProcess } from "node:child_process";
import { spawn } from "node:child_process";
import path from "node:path";
import type { INestApplication } from "@nestjs/common";
import { createConnection } from "mongoose";
import { createApplication } from "../../src/main";
import { compareResponses } from "./parity";

const legacyPort = 4199;
const legacyBaseUrl = `http://127.0.0.1:${legacyPort}`;

const waitForServer = async (url: string): Promise<void> => {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  throw new Error(`Timed out waiting for ${url}`);
};

describe("Support contract parity", () => {
  let legacy: ChildProcess;
  let nest: INestApplication;
  let nestBaseUrl: string;

  beforeAll(async () => {
    const legacyMongoUrl =
      "mongodb://127.0.0.1:27017/mentorme_legacy_support_contract";
    const cleanup = await createConnection(legacyMongoUrl).asPromise();
    await cleanup.dropDatabase();
    await cleanup.close();

    const legacyEntry = path.resolve(__dirname, "../../../backend/src/index.js");
    legacy = spawn(process.execPath, [legacyEntry], {
      env: {
        ...process.env,
        PORT: String(legacyPort),
        MONGO_URL: legacyMongoUrl,
        JWT_SECRET: process.env.JWT_SECRET,
      },
      stdio: "ignore",
    });
    await waitForServer(legacyBaseUrl);

    nest = await createApplication();
    await nest.listen(0, "127.0.0.1");
    nestBaseUrl = await nest.getUrl();
  }, 20_000);

  afterAll(async () => {
    legacy.kill();
    await nest.close();
  });

  it("matches guest help-request creation", async () => {
    await compareResponses(legacyBaseUrl, nestBaseUrl, {
      method: "POST",
      path: "/api/v1/help/help-requests",
      body: {
        guestName: "Parity User",
        guestEmail: "parity@example.com",
        subject: "Cannot update my profile",
        issueCategory: "Account Issues",
        priorityLevel: "Medium",
        issueDetails: "The profile form does not save my changes.",
      },
    });
  });

  it("matches unauthenticated owned-ticket access", async () => {
    await compareResponses(legacyBaseUrl, nestBaseUrl, {
      method: "GET",
      path: "/api/v1/help/help-requests/my",
    });
  });
});
