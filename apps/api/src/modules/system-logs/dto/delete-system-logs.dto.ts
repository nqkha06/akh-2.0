import { Transform, Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
} from "class-validator";

function optionalBoolean(value: unknown) {
  if (value === "true" || value === true) return true;
  if (value === "false" || value === false) return false;
  return value;
}

export class BulkDeleteSystemLogsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(1_000)
  @IsString({ each: true })
  ids!: string[];
}

export class CleanupSystemLogsDto {
  @IsIn(["older_than", "range"])
  mode!: "older_than" | "range";

  @ValidateIf((dto: CleanupSystemLogsDto) => dto.mode === "older_than" && !dto.before)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(3_650)
  days?: number;

  @ValidateIf((dto: CleanupSystemLogsDto) => dto.mode === "older_than" && !dto.days)
  @IsDateString()
  before?: string;

  @ValidateIf((dto: CleanupSystemLogsDto) => dto.mode === "range")
  @IsDateString()
  from?: string;

  @ValidateIf((dto: CleanupSystemLogsDto) => dto.mode === "range")
  @IsDateString()
  to?: string;

  @IsOptional()
  @Transform(({ value }) => optionalBoolean(value))
  @IsBoolean()
  dryRun = true;
}
