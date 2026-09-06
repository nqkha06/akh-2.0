import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsString,
  Matches,
  Max,
  Min,
  ValidateNested,
} from "class-validator";

import { SYSTEM_LOG_RETENTION_SCOPE_PATTERN } from "../system-log.constants";

export class SystemLogRetentionRuleDto {
  @IsString()
  @Matches(SYSTEM_LOG_RETENTION_SCOPE_PATTERN)
  scope!: string;

  @IsInt()
  @Min(1)
  @Max(3_650)
  retentionDays!: number;

  @IsBoolean()
  enabled!: boolean;
}

export class UpdateSystemLogSettingsDto {
  @IsInt()
  @Min(1)
  @Max(3_650)
  globalRetentionDays!: number;

  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => SystemLogRetentionRuleDto)
  rules!: SystemLogRetentionRuleDto[];
}
