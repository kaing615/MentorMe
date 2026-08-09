import type { ParityRuntime } from "./parity-runtime";
import { startParityRuntime } from "./parity-runtime";
import { compareResponses } from "./parity";

describe("Identity contract parity", () => {
  let runtime: ParityRuntime;

  beforeAll(async () => {
    runtime = await startParityRuntime("identity", 4200);
  }, 20_000);

  afterAll(async () => runtime.stop());

  it("matches signup, duplicate, signin, and opaque forgot-password responses", async () => {
    const signup = {
      userName: "parity_identity",
      email: "parity-identity@example.com",
      password: "secret123",
      confirmPassword: "secret123",
      firstName: "Parity",
      lastName: "Identity",
    };
    await compareResponses(runtime.legacyBaseUrl, runtime.nestBaseUrl, {
      method: "POST",
      path: "/api/v1/user/signup",
      body: signup,
    });
    await compareResponses(runtime.legacyBaseUrl, runtime.nestBaseUrl, {
      method: "POST",
      path: "/api/v1/user/signup",
      body: signup,
    });
    await compareResponses(runtime.legacyBaseUrl, runtime.nestBaseUrl, {
      method: "POST",
      path: "/api/v1/user/signin",
      body: { email: signup.email, password: signup.password },
    });
    await compareResponses(runtime.legacyBaseUrl, runtime.nestBaseUrl, {
      method: "POST",
      path: "/api/v1/user/forgot-password",
      body: { email: "missing-parity@example.com" },
    });
  });
});
