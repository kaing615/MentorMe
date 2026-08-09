import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { createApplication } from "../../src/main";
import { HealthService } from "../../src/health/health.service";

describe("health", () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    process.env.PORT = "4001";
    process.env.MONGO_URL = "mongodb://127.0.0.1:27017/mentorme_nest_health_test";
    process.env.JWT_SECRET = "health-test-secret-with-enough-length";
    process.env.CORS_ORIGINS = "http://localhost:5173";
    app = await createApplication();
  });

  afterAll(async () => app.close());

  it("reports liveness independently of readiness", async () => {
    app.get(HealthService).setReady(false);

    await request(app.getHttpServer()).get("/health/live").expect(200, { status: "ok" });
    await request(app.getHttpServer()).get("/health/ready").expect(503);
  });
});
