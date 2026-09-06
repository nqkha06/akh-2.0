import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Max,
  Min,
  ValidateNested,
} from "class-validator";

const placements = [
  "unlock_redirect",
  "popunder",
  "stu_before",
  "stu_after",
  "safe_overlay_top",
  "safe_overlay_bottom",
] as const;

export class MonetizationAdVisitorStateDto {
  @IsString()
  @Matches(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/)
  adId!: string;

  @IsArray()
  @ArrayMaxSize(20)
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(Number.MAX_SAFE_INTEGER, { each: true })
  timestamps!: number[];

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(20)
  sessionCount!: number;
}

export class RecordLinkVisitDto {
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/)
  siteKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  deliveryMode?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/)
  postType?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  categoryIds?: number[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  niches?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(20)
  locale?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(placements.length)
  @IsIn(placements, { each: true })
  placements?: Array<(typeof placements)[number]>;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => MonetizationAdVisitorStateDto)
  adState?: MonetizationAdVisitorStateDto[];
}
