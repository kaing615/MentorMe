import "reflect-metadata";
import { RequestMethod, ValidationPipe } from "@nestjs/common";
import type { INestApplication, NestApplicationOptions } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { CompatibilityInterceptor } from "./common/http/compatibility.interceptor";
import { HttpExceptionFilter } from "./common/http/http-exception.filter";

export const createApplication = async (): Promise<INestApplication> => {
  const options: NestApplicationOptions = { abortOnError: false };
  if (process.env.NODE_ENV === "test") options.logger = false;
  const app = await NestFactory.create(AppModule, options);
  const config = app.get(ConfigService);

  app.use(helmet());
  app.enableCors({
    origin: config
      .getOrThrow<string>("CORS_ORIGINS")
      .split(",")
      .map((origin) => origin.trim()),
    credentials: true,
  });
  app.setGlobalPrefix("api/v1", {
    exclude: [
      { path: "health/live", method: RequestMethod.GET },
      { path: "health/ready", method: RequestMethod.GET },
    ],
  });
  app.useGlobalPipes(
    new ValidationPipe({ transform: true, whitelist: true }),
  );
  app.useGlobalInterceptors(new CompatibilityInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableShutdownHooks();

  const swagger = new DocumentBuilder()
    .setTitle("MentorMe API")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  SwaggerModule.setup("api-docs", app, SwaggerModule.createDocument(app, swagger));

  await app.init();
  return app;
};

const bootstrap = async (): Promise<void> => {
  const app = await createApplication();
  const config = app.get(ConfigService);
  await app.listen(config.getOrThrow<number>("PORT"));
};

if (require.main === module) {
  void bootstrap();
}
