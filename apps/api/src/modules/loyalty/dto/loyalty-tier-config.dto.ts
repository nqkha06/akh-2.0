import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from "class-validator";

export const loyaltyTierIconKeys = [
  "sparkles",
  "shield-check",
  "trophy",
  "gem",
] as const;

export class LoyaltyBenefitDto {
  @IsString()
  @Matches(/^[a-z][a-z0-9_]{0,63}$/)
  key!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(160)
  label!: string;

  @IsBoolean()
  included!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  value?: string | null;
}

export class LoyaltyTierTranslationDto {
  @IsString()
  @Matches(/^[a-z]{2}(?:-[A-Z]{2})?$/)
  locale!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => LoyaltyBenefitDto)
  benefits!: LoyaltyBenefitDto[];
}
