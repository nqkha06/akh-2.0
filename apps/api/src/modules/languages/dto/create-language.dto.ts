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

export class CreateLanguageDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  nativeName?: string;

  @IsString()
  @Matches(/^[a-z]{2,3}(?:-[A-Z]{2})?$/)
  locale!: string;

  @IsString()
  @Matches(/^[a-z]{2,3}$/)
  code!: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z]{2,3}-[A-Z]{2}$/)
  regional?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{2}$/)
  flag?: string;

  @IsBoolean()
  isDefault!: boolean;

  @IsBoolean()
  isEnabled!: boolean;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10_000)
  sortOrder!: number;

  @IsBoolean()
  isRtl!: boolean;
}
