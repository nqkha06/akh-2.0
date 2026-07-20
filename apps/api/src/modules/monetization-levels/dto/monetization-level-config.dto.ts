import { Type } from "class-transformer";
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
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

  @IsUrl({ protocols: ["http", "https"], require_protocol: true })
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
