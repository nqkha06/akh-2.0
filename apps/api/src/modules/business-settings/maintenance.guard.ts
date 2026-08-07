import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import type { Request } from "express";

import { BusinessSettingsService } from "./business-settings.service";

@Injectable()
export class MaintenanceGuard implements CanActivate {
  constructor(private readonly settings: BusinessSettingsService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    if (
      request.method === "GET" ||
      request.originalUrl.startsWith("/api/admin/") ||
      request.originalUrl.startsWith("/api/auth/")
    ) {
      return true;
    }
    const settings = await this.settings.getRuntime();
    if (!settings.maintenanceMode) return true;
    throw new ServiceUnavailableException({
      code: "MAINTENANCE_MODE",
      message:
        "Hệ thống đang bảo trì. Các thao tác thay đổi dữ liệu tạm thời bị khóa.",
    });
  }
}
