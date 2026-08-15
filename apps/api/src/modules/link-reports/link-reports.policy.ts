import { BadRequestException } from "@nestjs/common";

import type { UpdateLinkReportDto } from "./dto/admin-link-report.dto";

export function assertLinkReportHasChanges(dto: UpdateLinkReportDto) {
  if (dto.status === undefined && dto.resolutionNote === undefined) {
    throw new BadRequestException("Không có thay đổi để lưu.");
  }
}

export function resolvedAtForStatus(status: string, now = new Date()) {
  return status === "resolved" || status === "dismissed" ? now : null;
}
