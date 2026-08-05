import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsDateString,
  IsIP,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";

export class AccessAnalysisQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  advanced = false;
}

export class IpAccessAnalysisQueryDto extends AccessAnalysisQueryDto {
  @IsIP()
  ip!: string;
}

export class UserAccessLogsQueryDto extends AccessAnalysisQueryDto {
  @IsOptional()
  @IsString()
  ip?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  linkId?: number;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === "true" || value === true) return true;
    if (value === "false" || value === false) return false;
    return value;
  })
  @IsBoolean()
  isEarn?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  rejectReasonMask?: number;

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
}
