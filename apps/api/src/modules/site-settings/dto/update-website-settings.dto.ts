import { Transform, Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEmail,
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

export const SOCIAL_PLATFORMS = [
  "facebook",
  "youtube",
  "instagram",
  "tiktok",
  "x",
  "linkedin",
  "github",
  "discord",
  "telegram",
  "zalo",
] as const;

const trim = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

const nullableTrim = ({ value }: { value: unknown }) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed || null;
};

export class WebsiteSocialLinkDto {
  @IsIn(SOCIAL_PLATFORMS)
  platform!: (typeof SOCIAL_PLATFORMS)[number];

  @Transform(trim)
  @IsUrl({ protocols: ["https"], require_protocol: true })
  @Matches(/^https:\/\//i)
  @MaxLength(2048)
  url!: string;

  @IsBoolean()
  isActive = true;

  @IsInt()
  @Min(0)
  @Max(1000)
  sortOrder = 0;
}

export class UpdateWebsiteSettingsDto {
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  siteName!: string;

  @IsOptional()
  @Transform(nullableTrim)
  @IsString()
  @MaxLength(40)
  siteShortName?: string | null;

  @IsOptional()
  @Transform(nullableTrim)
  @IsString()
  @MaxLength(320)
  siteDescription?: string | null;

  @IsOptional()
  @Transform(nullableTrim)
  @IsString()
  @MaxLength(160)
  siteTagline?: string | null;

  @IsOptional()
  @Transform(nullableTrim)
  @IsUrl({ protocols: ["http", "https"], require_protocol: true })
  @MaxLength(2048)
  siteUrl?: string | null;

  @IsOptional()
  @Transform(nullableTrim)
  @IsString()
  @MaxLength(64)
  logoLightId?: string | null;

  @IsOptional()
  @Transform(nullableTrim)
  @IsString()
  @MaxLength(64)
  logoDarkId?: string | null;

  @IsOptional()
  @Transform(nullableTrim)
  @IsString()
  @MaxLength(64)
  logoIconId?: string | null;

  @IsOptional()
  @Transform(nullableTrim)
  @IsString()
  @MaxLength(64)
  faviconId?: string | null;

  @IsOptional()
  @Transform(nullableTrim)
  @IsString()
  @MaxLength(64)
  defaultOgImageId?: string | null;

  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => WebsiteSocialLinkDto)
  socialLinks!: WebsiteSocialLinkDto[];

  @IsOptional()
  @Transform(nullableTrim)
  @IsEmail()
  @MaxLength(254)
  contactEmail?: string | null;

  @IsOptional()
  @Transform(nullableTrim)
  @IsEmail()
  @MaxLength(254)
  supportEmail?: string | null;

  @IsOptional()
  @Transform(nullableTrim)
  @IsString()
  @MaxLength(50)
  phone?: string | null;

  @IsOptional()
  @Transform(nullableTrim)
  @IsString()
  @MaxLength(500)
  address?: string | null;

  @IsOptional()
  @Transform(nullableTrim)
  @IsString()
  @MaxLength(200)
  workingHours?: string | null;

  @IsOptional()
  @Transform(nullableTrim)
  @IsUrl({ protocols: ["https"], require_protocol: true })
  @Matches(/^https:\/\//i)
  @MaxLength(2048)
  mapUrl?: string | null;
}
