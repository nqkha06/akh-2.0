import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

import { EMAIL_MESSAGE_STATUSES, EMAIL_TYPES } from "../email.constants";

export class ListEmailActivityQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(320)
  search?: string;

  @IsOptional()
  @IsIn(EMAIL_MESSAGE_STATUSES)
  status?: (typeof EMAIL_MESSAGE_STATUSES)[number];

  @IsOptional()
  @IsIn(EMAIL_TYPES)
  type?: (typeof EMAIL_TYPES)[number];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  templateId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  senderId?: number;

  @IsOptional()
  @IsISO8601()
  dateFrom?: string;

  @IsOptional()
  @IsISO8601()
  dateTo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  perPage = 20;

  @IsOptional()
  @Transform(({ value }) => value === true || value === "true")
  @IsBoolean()
  includeRaw = false;
}

export class EmailOverviewQueryDto {
  @IsOptional()
  @IsIn(["7d", "30d", "90d", "custom"])
  range: "7d" | "30d" | "90d" | "custom" = "30d";

  @IsOptional()
  @IsIn(["all", "transactional", "marketing"])
  mailType: "all" | "transactional" | "marketing" = "all";

  @IsOptional()
  @IsISO8601()
  dateFrom?: string;

  @IsOptional()
  @IsISO8601()
  dateTo?: string;
}

export class EmailActivityDetailQueryDto {
  @IsOptional()
  @Transform(({ value }) => value === true || value === "true")
  @IsBoolean()
  includeRaw = false;
}
