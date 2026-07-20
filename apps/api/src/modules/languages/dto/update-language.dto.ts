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
} from "class-validator";

import {
  publicationStatuses,
  type PublicationStatus,
} from "../../../common/constants/publication-status";

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
  @IsIn(publicationStatuses)
  status?: PublicationStatus;

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
