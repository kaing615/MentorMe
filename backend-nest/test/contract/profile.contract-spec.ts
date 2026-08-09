import { getConnectionToken } from "@nestjs/mongoose";
import jwt from "jsonwebtoken";
import { createConnection, Types } from "mongoose";
import type { Connection } from "mongoose";
import { compareResponses } from "./parity";
import type { ParityRuntime } from "./parity-runtime";
import { startParityRuntime } from "./parity-runtime";

describe("Profile contract parity", () => {
  let runtime: ParityRuntime;

  beforeAll(async () => {
    runtime = await startParityRuntime("profile", 4201);
    const userId = new Types.ObjectId();
    const user = {
      _id: userId,
      email: "profile-parity@example.com",
      userName: "profile_parity",
      firstName: "Profile",
      lastName: "Parity",
      role: "mentor",
      isVerified: true,
      avatarUrl: "",
      avatarPublicId: "",
      skills: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const legacy = await createConnection(runtime.legacyMongoUrl).asPromise();
    await legacy.collection("users").insertOne(user);
    await legacy.close();
    const nest = runtime.nestApp.get<Connection>(getConnectionToken());
    await nest.collection("users").insertOne(user);
  }, 20_000);

  afterAll(async () => runtime.stop());

  it("matches the merged current-user profile", async () => {
    const nest = runtime.nestApp.get<Connection>(getConnectionToken());
    const user = await nest.collection("users").findOne({
      email: "profile-parity@example.com",
    });
    const token = jwt.sign(
      { id: String(user?._id) },
      process.env.JWT_SECRET ?? "nest-test-secret-with-enough-length",
    );

    await compareResponses(runtime.legacyBaseUrl, runtime.nestBaseUrl, {
      method: "GET",
      path: "/api/v1/profile",
      token,
    });
  });
});
