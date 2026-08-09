import type { ChildProcess } from "node:child_process";
import { spawn } from "node:child_process";
import path from "node:path";
import type { INestApplication } from "@nestjs/common";
import { getConnectionToken } from "@nestjs/mongoose";
import { createConnection } from "mongoose";
import type { Connection } from "mongoose";
import { createApplication } from "../../src/main";

export type ParityRuntime = {
  legacyBaseUrl: string;
  legacyMongoUrl: string;
  nestBaseUrl: string;
  nestApp: INestApplication;
  stop(): Promise<void>;
};

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

export const startParityRuntime = async (
  name: string,
  legacyPort: number,
): Promise<ParityRuntime> => {
  const legacyMongoUrl = `mongodb://127.0.0.1:27017/mentorme_legacy_${name}_contract`;
  const cleanup = await createConnection(legacyMongoUrl).asPromise();
  await cleanup.dropDatabase();
  await cleanup.close();

  const legacyBaseUrl = `http://127.0.0.1:${legacyPort}`;
  const legacyEntry = path.resolve(__dirname, "../../../backend/src/index.js");
  const legacy: ChildProcess = spawn(process.execPath, [legacyEntry], {
    env: {
      ...process.env,
      PORT: String(legacyPort),
      MONGO_URL: legacyMongoUrl,
      JWT_SECRET: process.env.JWT_SECRET,
    },
    stdio: "ignore",
  });
  await waitForServer(legacyBaseUrl);

  const nestApp = await createApplication();
  const nestConnection = nestApp.get<Connection>(getConnectionToken());
  await nestConnection.dropDatabase();
  await nestApp.listen(0, "127.0.0.1");

  return {
    legacyBaseUrl,
    legacyMongoUrl,
    nestBaseUrl: await nestApp.getUrl(),
    nestApp,
    stop: async () => {
      legacy.kill();
      await nestConnection.dropDatabase();
      await nestApp.close();
    },
  };
};
