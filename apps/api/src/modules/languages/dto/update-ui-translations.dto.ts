import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";

class UiTranslationEntryDto {
  @IsString()
  @MaxLength(240)
  @Matches(/^[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*$/)
  key!: string;

  @IsString()
  @MaxLength(10_000)
  value!: string;
}

export class UpdateUiTranslationsDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  version!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10_000)
  catalogSize!: number;

  @IsArray()
  @ArrayMaxSize(10_000)
  @ValidateNested({ each: true })
  @Type(() => UiTranslationEntryDto)
  entries!: UiTranslationEntryDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10_000)
  @IsString({ each: true })
  @MaxLength(240, { each: true })
  @Matches(/^[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*$/, { each: true })
  removedKeys?: string[];
}
