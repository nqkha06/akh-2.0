import { PartialType } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";

import {
  ANNOUNCEMENT_DISPLAYS,
  ANNOUNCEMENT_PRIORITIES,
  ANNOUNCEMENT_STATUSES,
  ANNOUNCEMENT_TARGET_TYPES,
  ANNOUNCEMENT_TYPES,
} from "../announcement.constants";

export class AnnouncementTargetRulesDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(500)
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  userIds?: number[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ArrayUnique()
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  roles?: string[];
}

export class CreateAnnouncementDto {
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  summary?: string;

  @IsString()
  @MinLength(3)
  @MaxLength(20_000)
  content!: string;

  @IsIn(ANNOUNCEMENT_TYPES)
  type!: (typeof ANNOUNCEMENT_TYPES)[number];

  @IsIn(ANNOUNCEMENT_PRIORITIES)
  priority!: (typeof ANNOUNCEMENT_PRIORITIES)[number];

  @IsIn(ANNOUNCEMENT_DISPLAYS)
  displayType!: (typeof ANNOUNCEMENT_DISPLAYS)[number];

  @IsIn(ANNOUNCEMENT_STATUSES)
  status!: (typeof ANNOUNCEMENT_STATUSES)[number];

  @IsIn(ANNOUNCEMENT_TARGET_TYPES)
  targetType!: (typeof ANNOUNCEMENT_TARGET_TYPES)[number];

  @ValidateNested()
  @Type(() => AnnouncementTargetRulesDto)
  targetRules!: AnnouncementTargetRulesDto;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  actionLabel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(800)
  actionUrl?: string;

  @IsBoolean()
  isDismissible!: boolean;

  @IsBoolean()
  requiresAcknowledgement!: boolean;

  @IsOptional()
  @IsISO8601()
  startsAt?: string | null;

  @IsOptional()
  @IsISO8601()
  endsAt?: string | null;
}

export class UpdateAnnouncementDto extends PartialType(CreateAnnouncementDto) {}

export class ListAnnouncementsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @IsOptional()
  @IsIn(ANNOUNCEMENT_STATUSES)
  status?: (typeof ANNOUNCEMENT_STATUSES)[number];

  @IsOptional()
  @IsIn(ANNOUNCEMENT_DISPLAYS)
  displayType?: (typeof ANNOUNCEMENT_DISPLAYS)[number];

  @IsOptional()
  @IsIn(ANNOUNCEMENT_PRIORITIES)
  priority?: (typeof ANNOUNCEMENT_PRIORITIES)[number];

  @IsOptional()
  @IsIn(ANNOUNCEMENT_TARGET_TYPES)
  targetType?: (typeof ANNOUNCEMENT_TARGET_TYPES)[number];

  @IsOptional()
  @IsISO8601()
  dateFrom?: string;

  @IsOptional()
  @IsISO8601()
  dateTo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  perPage = 20;
}

export class ListMemberAnnouncementsQueryDto {
  @IsOptional()
  @IsIn(ANNOUNCEMENT_DISPLAYS)
  displayType?: (typeof ANNOUNCEMENT_DISPLAYS)[number];

  @IsOptional()
  @Transform(({ value }) => value === true || value === "true")
  @IsBoolean()
  unreadOnly = false;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  perPage = 20;
}
