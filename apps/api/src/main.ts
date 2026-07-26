import "reflect-metadata";

import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";
import { setupSwagger } from "./config/swagger";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  const configService = app.get(ConfigService);
  const port = configService.get<number>("API_PORT", 4000);
  const allowedOrigins = configService
    .getOrThrow<string>("FRONTEND_ORIGIN")
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);

  app.setGlobalPrefix("api");
  app.enableCors({
    origin(
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) {
      if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ""))) {
        callback(null, true);
        return;
      }
      callback(new Error("Origin không được CORS cho phép."), false);
    },
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const swagger = setupSwagger(app, configService);
  await app.listen(port);

  if (swagger) {
    const appUrl = await app.getUrl();
    console.log(`Swagger UI: ${appUrl}${swagger.uiPath}`);
    console.log(`OpenAPI JSON: ${appUrl}${swagger.jsonPath}`);
  }
}

void bootstrap();
