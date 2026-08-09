import {
  Controller,
  Get,
  ServiceUnavailableException,
} from "@nestjs/common";
import { HealthService } from "./health.service";

@Controller("health")
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get("live")
  live(): { status: "ok" } {
    return { status: "ok" };
  }

  @Get("ready")
  ready(): { status: "ready" } {
    if (!this.health.isReady()) {
      throw new ServiceUnavailableException("Service unavailable");
    }
    return { status: "ready" };
  }
}
