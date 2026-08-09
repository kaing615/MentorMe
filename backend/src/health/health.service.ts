import { Injectable } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { ConnectionStates } from "mongoose";
import type { Connection } from "mongoose";

@Injectable()
export class HealthService {
  private readinessOverride: boolean | undefined;

  constructor(@InjectConnection() private readonly connection: Connection) {}

  isReady(): boolean {
    return (
      this.readinessOverride ??
      this.connection.readyState === ConnectionStates.connected
    );
  }

  setReady(ready: boolean): void {
    this.readinessOverride = ready;
  }
}
