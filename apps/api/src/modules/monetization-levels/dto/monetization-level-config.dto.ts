import { Type } from "class-transformer";
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsArray,
  IsObject,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
  ArrayMaxSize,
} from "class-validator";

import { publicationStatuses } from "../../../common/constants/publication-status";

export const monetizationStatuses = publicationStatuses;
export const adDensities = ["none", "limited", "maximum"] as const;
export const deviceTypes = ["any", "desktop", "mobile", "tablet"] as const;
export const routeMatchModes = ["include", "exclude"] as const;
export const browserFamilies = [
  "any",
  "chrome",
  "safari",
  "firefox",
  "edge",
  "other",
] as const;
export const monetizationAdFormats = ["smartlink", "banner", "script"] as const;
export const monetizationAdPlacements = [
  "unlock_redirect",
  "popunder",
  "stu_before",
  "stu_after",
  "safe_overlay_top",
  "safe_overlay_bottom",
] as const;
export const operatingSystemFamilies = [
  "any",
  "android",
  "ios",
  "windows",
  "macos",
  "linux",
  "other",
] as const;
export const monetizationDeliveryModes = ["any", "original", "random_post"] as const;

export class MonetizationLevelTranslationDto {
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
}

export class VisitorExperienceDto {
  @IsIn(adDensities)
  popup!: (typeof adDensities)[number];

  @IsIn(adDensities)
  banner!: (typeof adDensities)[number];

  @IsIn(adDensities)
  interstitial!: (typeof adDensities)[number];

  @IsIn(adDensities)
  notification!: (typeof adDensities)[number];
}

export class MonetizationMetaDataDto {
  @IsInt()
  @Min(1)
  @Max(1)
  version = 1;

  @IsInt()
  @Min(0)
  @Max(10_000)
  profitBps!: number;

  @IsInt()
  @Min(1)
  @Max(20)
  stepCount!: number;

  @ValidateNested()
  @Type(() => VisitorExperienceDto)
  visitorExperience!: VisitorExperienceDto;
}

export class MonetizationRouteDto {
  @IsString()
  @Matches(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/)
  id!: string;

  @IsString()
  @Matches(/^(?:[A-Z]{2}|ALL|ZZ)$/)
  countryCode!: string;

  @IsOptional()
  @IsIn(routeMatchModes)
  countryMode?: (typeof routeMatchModes)[number];

  @IsIn(deviceTypes)
  deviceType!: (typeof deviceTypes)[number];

  @IsOptional()
  @IsIn(routeMatchModes)
  deviceMode?: (typeof routeMatchModes)[number];

  @IsIn(browserFamilies)
  browserFamily!: (typeof browserFamilies)[number];

  @IsOptional()
  @IsIn(routeMatchModes)
  browserMode?: (typeof routeMatchModes)[number];

  @IsUrl({
    protocols: ["http", "https"],
    require_protocol: true,
    require_tld: false,
  })
  @MaxLength(2_048)
  targetUrl!: string;

  @IsInt()
  @Min(0)
  @Max(10_000)
  priority!: number;

  @IsInt()
  @Min(1)
  @Max(100)
  weight!: number;

  @IsBoolean()
  enabled!: boolean;
}

export class MonetizationRateDto {
  @IsString()
  @Matches(/^(?:[A-Z]{2}|ALL|ZZ)$/)
  countryCode!: string;

  @IsIn(deviceTypes)
  deviceType!: (typeof deviceTypes)[number];

  @IsString()
  @Matches(/^(?:0|[1-9]\d{0,7})(?:\.\d{1,6})?$/)
  baseCpm!: string;

  @IsString()
  @Matches(/^[A-Z]{3}$/)
  currency!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10_000_000)
  dailyLimit?: number | null;

  @IsBoolean()
  enabled!: boolean;
}

export class MonetizationAdTargetingDto {
  @IsArray()
  @ArrayMaxSize(250)
  @IsString({ each: true })
  countries!: string[];

  @IsArray()
  @ArrayMaxSize(deviceTypes.length)
  @IsIn(deviceTypes, { each: true })
  devices!: Array<(typeof deviceTypes)[number]>;

  @IsArray()
  @ArrayMaxSize(operatingSystemFamilies.length)
  @IsIn(operatingSystemFamilies, { each: true })
  operatingSystems!: Array<(typeof operatingSystemFamilies)[number]>;

  @IsArray()
  @ArrayMaxSize(browserFamilies.length)
  @IsIn(browserFamilies, { each: true })
  browsers!: Array<(typeof browserFamilies)[number]>;

  @IsArray()
  @ArrayMaxSize(monetizationDeliveryModes.length)
  @IsIn(monetizationDeliveryModes, { each: true })
  deliveryModes!: Array<(typeof monetizationDeliveryModes)[number]>;

  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  niches!: string[];

  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  siteKeys!: string[];

  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  postTypes!: string[];

  @IsArray()
  @ArrayMaxSize(200)
  @IsInt({ each: true })
  @Min(1, { each: true })
  categoryIds!: number[];

  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  locales!: string[];
}

export class MonetizationSmartlinkOverridesDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(300)
  redirectDelaySeconds?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(20)
  maxRedirectsPerSession?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(20)
  maxRedirectsPerVisitor?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(720)
  frequencyWindowHours?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10_080)
  cooldownMinutes?: number;

  @IsOptional()
  @IsDateString()
  startAt?: string;

  @IsOptional()
  @IsDateString()
  endAt?: string;
}

export class MonetizationSmartlinkDto {
  @IsString()
  @Matches(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/)
  id!: string;

  @IsUrl({
    protocols: ["http", "https"],
    require_protocol: true,
    require_tld: false,
  })
  @MaxLength(2_048)
  url!: string;

  @IsBoolean()
  enabled!: boolean;

  @IsInt()
  @Min(1)
  @Max(100)
  weight!: number;

  @IsInt()
  @Min(0)
  @Max(10_000)
  sortOrder!: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => MonetizationSmartlinkOverridesDto)
  overrides?: MonetizationSmartlinkOverridesDto;
}

export class MonetizationAdContentDto {
  @IsOptional()
  @IsUrl({
    protocols: ["http", "https"],
    require_protocol: true,
    require_tld: false,
  })
  @MaxLength(2_048)
  targetUrl?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => MonetizationSmartlinkDto)
  smartlinks?: MonetizationSmartlinkDto[];

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(300)
  redirectDelaySeconds?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(20)
  maxRedirectsPerSession?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(20)
  maxRedirectsPerVisitor?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(720)
  frequencyWindowHours?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10_080)
  cooldownMinutes?: number;

  @IsOptional()
  @IsDateString()
  startAt?: string;

  @IsOptional()
  @IsDateString()
  endAt?: string;

  @IsOptional()
  @IsUrl({ protocols: ["http", "https"], require_protocol: true })
  @MaxLength(2_048)
  imageUrl?: string;

  @IsOptional()
  @IsUrl({ protocols: ["http", "https"], require_protocol: true })
  @MaxLength(2_048)
  clickUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(140)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  ctaLabel?: string;

  @IsOptional()
  @IsBoolean()
  newTab?: boolean;

  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/)
  adapter?: string;

  @IsOptional()
  @IsUrl({ protocols: ["http", "https"], require_protocol: true })
  @MaxLength(2_048)
  scriptUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  zoneId?: string;

  @IsOptional()
  @IsObject()
  parameters?: Record<string, string | number | boolean>;
}

export class MonetizationAdDto {
  @IsString()
  @Matches(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/)
  id!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsBoolean()
  enabled!: boolean;

  @IsIn(monetizationAdFormats)
  format!: (typeof monetizationAdFormats)[number];

  @IsArray()
  @ArrayMaxSize(monetizationAdPlacements.length)
  @IsIn(monetizationAdPlacements, { each: true })
  placements!: Array<(typeof monetizationAdPlacements)[number]>;

  @IsInt()
  @Min(0)
  @Max(10_000)
  priority!: number;

  @IsInt()
  @Min(1)
  @Max(100)
  weight!: number;

  @ValidateNested()
  @Type(() => MonetizationAdTargetingDto)
  targeting!: MonetizationAdTargetingDto;

  @ValidateNested()
  @Type(() => MonetizationAdContentDto)
  content!: MonetizationAdContentDto;
}
