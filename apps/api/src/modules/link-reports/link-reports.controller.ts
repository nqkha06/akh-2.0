import { Body, Controller, Post } from "@nestjs/common";

import { AuthRateLimit } from "../auth/decorators/auth-rate-limit.decorator";
import { CreateLinkReportDto } from "./dto/create-link-report.dto";
import { LinkReportsService } from "./link-reports.service";

@Controller("public/link-reports")
export class LinkReportsController {
  constructor(private readonly reports: LinkReportsService) {}

  @Post()
  @AuthRateLimit(5, 60 * 60_000)
  create(@Body() dto: CreateLinkReportDto) {
    return this.reports.create(dto);
  }
}
