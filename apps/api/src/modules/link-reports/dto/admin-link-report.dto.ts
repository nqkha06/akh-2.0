import { Transform, Type } from "class-transformer";
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

import {
  LINK_REPORT_REASONS,
  LINK_REPORT_STATUSES,
} from "../link-report.constants";

export class QueryLinkReportsDto {
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim() : value,
  )
  @IsString()
  @MaxLength(200)
  search?: string;

  @IsOptional()
  @IsIn(LINK_REPORT_STATUSES)
  status?: (typeof LINK_REPORT_STATUSES)[number];

  @IsOptional()
  @IsIn(LINK_REPORT_REASONS)
  reason?: (typeof LINK_REPORT_REASONS)[number];

  @IsOptional()
  @IsIn(["createdAt", "updatedAt", "status", "email"])
  sortBy: "createdAt" | "updatedAt" | "status" | "email" = "createdAt";

  @IsOptional()
  @IsIn(["asc", "desc"])
  sortOrder: "asc" | "desc" = "desc";

  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  perPage = 20;
}

export class UpdateLinkReportDto {
  @IsOptional()
  @IsIn(LINK_REPORT_STATUSES)
  status?: (typeof LINK_REPORT_STATUSES)[number];

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim() : value,
  )
  @IsString()
  @MaxLength(2_000)
  resolutionNote?: string;
}
