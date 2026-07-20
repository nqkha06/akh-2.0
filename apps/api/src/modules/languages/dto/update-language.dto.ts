import { Type } from "class-transformer";
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class UpdateLanguageDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  nativeName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z]{2,3}(?:-[A-Z]{2})?$/)
  locale?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z]{2,3}$/)
  code?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z]{2,3}-[A-Z]{2}$/)
  regional?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{2}$/)
  flag?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10_000)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isRtl?: boolean;
}
