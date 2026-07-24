import type { INestApplication } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

const SWAGGER_PATH = "docs";
const ACCESS_TOKEN_SECURITY = "access-token";

export function setupSwagger(
  app: INestApplication,
  configService: ConfigService,
) {
  if (!isSwaggerEnabled(configService)) return null;

  const config = new DocumentBuilder()
    .setTitle("STU Platform API")
    .setDescription(
      [
        "Tài liệu API dành cho frontend, member và admin.",
        "",
        "Đăng nhập bằng `POST /api/auth/login`, sao chép `accessToken` từ response,",
        "sau đó bấm **Authorize** và nhập token để thử các API được bảo vệ.",
        "Refresh token được lưu trong HttpOnly cookie và Swagger UI gửi cookie cùng request.",
      ].join("\n"),
    )
    .setVersion("1.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Nhập access token, không cần thêm tiền tố Bearer.",
      },
      ACCESS_TOKEN_SECURITY,
    )
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    deepScanRoutes: true,
    autoTagControllers: true,
    operationIdFactory: (controllerKey, methodKey) =>
      `${controllerKey.replace(/Controller$/, "")}_${methodKey}`,
  });

  // Authentication is optional at the document level so public endpoints stay
  // accurate. Swagger UI still attaches the token after the user authorizes.
  document.security = [{ [ACCESS_TOKEN_SECURITY]: [] }, {}];

  SwaggerModule.setup(SWAGGER_PATH, app, document, {
    useGlobalPrefix: true,
    customSiteTitle: "STU Platform API Docs",
    swaggerOptions: {
      displayRequestDuration: true,
      filter: true,
      persistAuthorization: true,
      tryItOutEnabled: true,
      withCredentials: true,
    },
  });

  return {
    uiPath: `/api/${SWAGGER_PATH}`,
    jsonPath: `/api/${SWAGGER_PATH}-json`,
  };
}

function isSwaggerEnabled(configService: ConfigService) {
  const configured = configService.get<string>("SWAGGER_ENABLED");
  if (configured !== undefined) {
    if (!["true", "false"].includes(configured.toLowerCase())) {
      throw new Error("SWAGGER_ENABLED chỉ nhận true hoặc false.");
    }
    return configured.toLowerCase() === "true";
  }

  return configService.get<string>("NODE_ENV") !== "production";
}
