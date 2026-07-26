import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  ValidateNested,
} from "class-validator";

import { publicationStatuses } from "../../../common/constants/publication-status";
import {
  loyaltyTierIconKeys,
  LoyaltyTierTranslationDto,
} from "./loyalty-tier-config.dto";

export class UpdateLoyaltyTierDto {
  @IsOptional()
  @IsString()
  @Matches(/^[a-z][a-z0-9-]{1,49}$/)
  key?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2_147_483_647)
  minimumValidViews?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10_000)
  sortOrder?: number;

  @IsOptional()
  @IsIn(loyaltyTierIconKeys)
  iconKey?: (typeof loyaltyTierIconKeys)[number] | null;

  @IsOptional()
  @IsIn(publicationStatuses)
  status?: (typeof publicationStatuses)[number];

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => LoyaltyTierTranslationDto)
  translations?: LoyaltyTierTranslationDto[];
}
