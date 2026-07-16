import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from "class-validator";

class CreateLinkActionDto {
  @IsString()
  @IsNotEmpty()
  platform: string;

  @IsString()
  @IsNotEmpty()
  action: string;

  @IsUrl({ protocols: ["http", "https"], require_protocol: true, require_valid_protocol: true })
  url: string;
}

class BackgroundEffectsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  opacity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  blur?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(200)
  saturation?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(200)
  contrast?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  grayscale?: number;
}

class BackgroundSettingsDto {
  @IsOptional()
  @IsString()
  selectedBackgroundId?: string;

  @IsOptional()
  @IsString()
  selectedBackgroundName?: string;

  @IsOptional()
  @IsIn(["image", "video", "youtube"])
  backgroundMediaType?: "image" | "video" | "youtube";

  @IsOptional()
  @IsString()
  backgroundMediaUrl?: string;

  @IsOptional()
  @IsBoolean()
  sameAsCoverImage?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => BackgroundEffectsDto)
  effects?: BackgroundEffectsDto;
}

export class CreateLinkDto {
  @ValidateIf((payload: CreateLinkDto) => payload.inputType === "url")
  @IsUrl({ protocols: ["http", "https"], require_protocol: true, require_valid_protocol: true })
  destinationUrl: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsIn(["url", "file", "snippet"])
  inputType: "url" | "file" | "snippet";

  @IsOptional()
  @IsString()
  selectedSnippet?: string;

  @IsOptional()
  @IsString()
  selectedFile?: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsString()
  customAlias?: string;

  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @IsOptional()
  @IsBoolean()
  expiryEnabled?: boolean;

  @ValidateIf((payload: CreateLinkDto) => payload.expiryEnabled === true)
  @IsIn(["date", "clicks"])
  expiryType?: "date" | "clicks";

  @ValidateIf((payload: CreateLinkDto) => payload.expiryEnabled === true && payload.expiryType === "date")
  @IsDateString()
  expiryDate?: string;

  @IsOptional()
  @IsString()
  expiryTime?: string;

  @ValidateIf((payload: CreateLinkDto) => payload.expiryEnabled === true && payload.expiryType === "clicks")
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxClicks?: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateLinkActionDto)
  actions: CreateLinkActionDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => BackgroundSettingsDto)
  backgroundSettings?: BackgroundSettingsDto;
}
