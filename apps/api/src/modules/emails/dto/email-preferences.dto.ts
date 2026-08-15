import { Type } from "class-transformer";
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

import { EMAIL_CATEGORIES } from "../email.constants";

export class CreateEmailPreferenceTopicDto {
  @IsString()
  @Matches(/^[a-z][a-z0-9_]{2,79}$/)
  code!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(500)
  description!: string;

  @IsIn(EMAIL_CATEGORIES)
  category!: (typeof EMAIL_CATEGORIES)[number];

  @IsBoolean()
  isRequired!: boolean;

  @IsBoolean()
  isEnabled!: boolean;

  @IsInt()
  @Min(0)
  @Max(10_000)
  displayOrder!: number;
}

export class UpdateEmailPreferenceTopicDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10_000)
  displayOrder?: number;
}
