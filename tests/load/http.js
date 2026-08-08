import http from "k6/http";
import { check } from "k6";

const baseUrl = __ENV.BASE_URL || "http://localhost";

export const options = {
  scenarios: {
    public_reads: {
      executor: "constant-arrival-rate",
      rate: 100,
      timeUnit: "1s",
      duration: __ENV.DURATION || "2m",
      preAllocatedVUs: 100,
      maxVUs: 200,
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<300", "p(99)<800"],
  },
};

export default function () {
  const selector = Math.random();
  const path = selector < 0.7
    ? "/api/v1/course?page=1&limit=10"
    : selector < 0.95
      ? "/api/v1/profile/top-mentors?limit=6"
      : "/health/ready";
  const response = http.get(`${baseUrl}${path}`, {
    tags: { endpoint: path.split("?")[0] },
  });
  check(response, { "status is successful": (result) => result.status === 200 });
}
