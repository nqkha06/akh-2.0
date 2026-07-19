import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  ValidateNested,
} from "class-validator";

import {
  MonetizationLevelTranslationDto,
  MonetizationMetaDataDto,
  MonetizationRateDto,
  MonetizationRouteDto,
  monetizationStatuses,
} from "./monetization-level-config.dto";

export class UpdateMonetizationLevelDto {
  @IsOptional()
  @IsString()
  @Matches(/^[a-z][a-z0-9-]{1,49}$/)
  key?: string;

  @IsOptional()
  @IsIn(monetizationStatuses)
  status?: (typeof monetizationStatuses)[number];

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10_000)
  sortOrder?: number;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => MonetizationLevelTranslationDto)
  translations?: MonetizationLevelTranslationDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => MonetizationMetaDataDto)
  metaData?: MonetizationMetaDataDto;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => MonetizationRouteDto)
  routes?: MonetizationRouteDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(300)
  @ValidateNested({ each: true })
  @Type(() => MonetizationRateDto)
  rates?: MonetizationRateDto[];
}
