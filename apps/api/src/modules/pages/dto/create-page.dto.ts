import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

import { PAGE_STATUSES, type PageStatus } from "../pages.constants";

const trim = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

const nullableTrim = ({ value }: { value: unknown }) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed || null;
};

export class CreatePageDto {
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(200)
  slug?: string;

  @IsOptional()
  @Transform(nullableTrim)
  @IsString()
  @MaxLength(500)
  excerpt?: string | null;

  @IsObject()
  contentJson!: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(2_000_000)
  contentHtml?: string;

  @IsOptional()
  @IsIn(PAGE_STATUSES)
  status: PageStatus = "DRAFT";

  @IsOptional()
  @Transform(nullableTrim)
  @IsString()
  @MaxLength(64)
  featuredImageId?: string | null;

  @IsOptional()
  @Transform(nullableTrim)
  @IsString()
  @MaxLength(200)
  seoTitle?: string | null;

  @IsOptional()
  @Transform(nullableTrim)
  @IsString()
  @MaxLength(320)
  seoDescription?: string | null;

  @IsOptional()
  @Transform(nullableTrim)
  @IsString()
  @MaxLength(500)
  seoKeywords?: string | null;

  @IsOptional()
  @Transform(nullableTrim)
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  canonicalUrl?: string | null;

  @IsOptional()
  @IsBoolean()
  robotsIndex = true;

  @IsOptional()
  @IsBoolean()
  robotsFollow = true;

  @IsOptional()
  @IsInt()
  @Min(-1_000_000)
  @Max(1_000_000)
  sortOrder = 0;
}
