import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
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

export class CreateMonetizationLevelDto {
  @IsString()
  @Matches(/^[a-z][a-z0-9-]{1,49}$/)
  key!: string;

  @IsIn(monetizationStatuses)
  status!: (typeof monetizationStatuses)[number];

  @IsBoolean()
  isDefault!: boolean;

  @IsInt()
  @Min(0)
  @Max(10_000)
  sortOrder!: number;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => MonetizationLevelTranslationDto)
  translations!: MonetizationLevelTranslationDto[];

  @ValidateNested()
  @Type(() => MonetizationMetaDataDto)
  metaData!: MonetizationMetaDataDto;

  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => MonetizationRouteDto)
  routes!: MonetizationRouteDto[];

  @IsArray()
  @ArrayMaxSize(300)
  @ValidateNested({ each: true })
  @Type(() => MonetizationRateDto)
  rates!: MonetizationRateDto[];
}
