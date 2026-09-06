import { Type } from "class-transformer";
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

import { SYSTEM_LOG_LEVELS, type SystemLogLevel } from "../system-log.constants";

export class ListSystemLogsQueryDto {
  @IsOptional()
  @IsIn(SYSTEM_LOG_LEVELS)
  level?: SystemLogLevel;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  context?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  event?: string;

  @IsOptional()
  @IsString()
  @MaxLength(254)
  user?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  keyword?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(10)
  @Max(100)
  perPage = 20;

  @IsOptional()
  @IsIn(["asc", "desc"])
  sortOrder: "asc" | "desc" = "desc";
}
