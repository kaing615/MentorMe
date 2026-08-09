import { Injectable } from "@nestjs/common";
import { AvailabilityService } from "../mentoring/availability.service";

@Injectable()
export class AvailabilityCleanupService {
  constructor(private readonly availability: AvailabilityService) {}

  run() {
    return this.availability.deleteOlderThan(3);
  }
}
