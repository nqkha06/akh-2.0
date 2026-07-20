import { Type } from "class-transformer";
import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateNested,
} from "class-validator";

class BioSocialLinkDto {
  @IsString()
  @MaxLength(80)
  id: string;

  @IsString()
  @MaxLength(80)
  platform: string;

  @IsUrl({ require_protocol: true })
  url: string;
}

class BioCustomLinkDto {
  @IsString()
  @MaxLength(80)
  id: string;

  @IsString()
  @MaxLength(120)
  title: string;

  @IsUrl({ require_protocol: true })
  url: string;
}

class BioWidgetDto {
  @IsString()
  @MaxLength(80)
  id: string;

  @IsString()
  @MaxLength(80)
  type: string;

  @IsString()
  @MaxLength(120)
  title: string;

  @IsUrl({ require_protocol: true })
  url: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  description?: string;
}

class BioAppearanceDto {
  @IsString()
  @MaxLength(60)
  buttonStyle: string;

  @IsString()
  @MaxLength(24)
  backgroundColor: string;

  @IsOptional()
  @IsString()
  @MaxLength(800)
  backgroundImage?: string;

  @IsOptional()
  @IsIn(["image", "video", "youtube"])
  backgroundMediaType?: "image" | "video" | "youtube";

  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(800)
  backgroundMediaUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  selectedBackgroundId?: string;
}

export class CreateBioPageDto {
  @IsString()
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  customSlug?: string;

  @IsOptional()
  @IsIn(["published", "draft"])
  status?: "published" | "draft";

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BioSocialLinkDto)
  socialLinks: BioSocialLinkDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BioCustomLinkDto)
  customLinks: BioCustomLinkDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BioWidgetDto)
  widgets: BioWidgetDto[];

  @IsArray()
  @IsString({ each: true })
  hiddenLinks: string[];

  @ValidateNested()
  @Type(() => BioAppearanceDto)
  appearance: BioAppearanceDto;
}
