import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

const logStates = ["normal", "rejected", "suspicious"] as const;
const reviewStates = ["unreviewed", "safe", "suspicious", "follow_up"] as const;
const sortColumns = ["createdAt", "revenue"] as const;

function optionalBoolean(value: unknown) {
  if (value === "true" || value === true) return true;
  if (value === "false" || value === false) return false;
  return value;
}

export class ListStuAccessLogsQueryDto {
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
  userId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(254)
  user?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  linkId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  link?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  ip?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  country?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([1, 2, 3])
  device?: number;

  @IsOptional()
  @Transform(({ value }) => optionalBoolean(value))
  @IsBoolean()
  isEarn?: boolean;

  @IsOptional()
  @Transform(({ value }) => optionalBoolean(value))
  @IsBoolean()
  hasRevenue?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  detectionMask?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  rejectReasonMask?: number;

  @IsOptional()
  @IsIn(logStates)
  state?: (typeof logStates)[number];

  @IsOptional()
  @IsIn(reviewStates)
  reviewStatus?: (typeof reviewStates)[number];

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
  @IsIn(sortColumns)
  sortBy: (typeof sortColumns)[number] = "createdAt";

  @IsOptional()
  @IsIn(["asc", "desc"])
  sortOrder: "asc" | "desc" = "desc";
}

export type AccessLogState = (typeof logStates)[number];
export type AccessLogReviewStatus = Exclude<
  (typeof reviewStates)[number],
  "unreviewed"
>;
