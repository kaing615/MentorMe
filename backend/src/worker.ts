import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AvailabilityCleanupService } from "./worker/availability-cleanup.service";
import { WorkerModule } from "./worker/worker.module";

export const runWorker = async (): Promise<void> => {
  const context = await NestFactory.createApplicationContext(WorkerModule, {
    abortOnError: false,
    logger: process.env.NODE_ENV === "test" ? false : ["log", "error", "warn"],
  });
  try {
    await context.get(AvailabilityCleanupService).run();
  } finally {
    await context.close();
  }
};

if (require.main === module) {
  void runWorker().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
