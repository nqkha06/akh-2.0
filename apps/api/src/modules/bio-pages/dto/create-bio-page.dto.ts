import { Type } from "class-transformer";
import {
  IsArray,
  ArrayMaxSize,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
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

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
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

  @IsOptional()
  @IsIn(["none", "pulse", "shake", "bounce", "glow"])
  animationEffect?: "none" | "pulse" | "shake" | "bounce" | "glow";
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

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

class BioGalleryImageDto {
  @IsString()
  @MaxLength(80)
  id: string;

  @IsString()
  @MaxLength(32)
  fileId: string;

  @IsString()
  @MaxLength(1000)
  url: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  thumbnailUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  alt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  caption?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true, protocols: ["http", "https"] })
  @MaxLength(1000)
  linkUrl?: string;

  @IsOptional()
  @IsBoolean()
  openInNewTab?: boolean;

  @IsInt()
  @Min(0)
  @Max(19)
  sortOrder: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20000)
  width?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20000)
  height?: number;
}

class BioGalleryColumnsDto {
  @IsInt()
  @Min(1)
  @Max(3)
  mobile: number;

  @IsInt()
  @Min(1)
  @Max(4)
  tablet: number;

  @IsInt()
  @Min(1)
  @Max(6)
  desktop: number;
}

class BioGalleryBlockDto {
  @IsString()
  @MaxLength(80)
  id: string;

  @IsIn(["gallery"])
  type: "gallery";

  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @IsBoolean()
  enabled: boolean;

  @IsBoolean()
  showTitle: boolean;

  @IsIn(["grid", "slider"])
  displayMode: "grid" | "slider";

  @IsIn(["1:1", "4:5", "16:9", "original"])
  aspectRatio: "1:1" | "4:5" | "16:9" | "original";

  @ValidateNested()
  @Type(() => BioGalleryColumnsDto)
  columns: BioGalleryColumnsDto;

  @IsIn(["sm", "md", "lg"])
  gap: "sm" | "md" | "lg";

  @IsIn(["none", "sm", "md", "lg", "full"])
  radius: "none" | "sm" | "md" | "lg" | "full";

  @IsBoolean()
  showCaption: boolean;

  @IsIn(["none", "subtle"])
  border: "none" | "subtle";

  @IsIn(["none", "sm", "md"])
  shadow: "none" | "sm" | "md";

  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => BioGalleryImageDto)
  images: BioGalleryImageDto[];
}

class BioDividerBlockDto {
  @IsString()
  @MaxLength(80)
  id: string;

  @IsIn(["divider"])
  type: "divider";

  @IsBoolean()
  enabled: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  label?: string;

  @IsBoolean()
  showLabel: boolean;

  @IsIn(["solid", "dashed", "dotted"])
  style: "solid" | "dashed" | "dotted";

  @IsIn(["sm", "md", "lg"])
  spacing: "sm" | "md" | "lg";
}

class BioBankDetailsBlockDto {
  @IsString()
  @MaxLength(80)
  id: string;

  @IsIn(["bank-details"])
  type: "bank-details";

  @IsBoolean()
  enabled: boolean;

  @IsString()
  @MaxLength(120)
  title: string;

  @IsString()
  @MaxLength(120)
  bankName: string;

  @IsString()
  @MaxLength(160)
  accountName: string;

  @IsString()
  @MaxLength(80)
  accountNumber: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  branch?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;

  @IsBoolean()
  showCopyButton: boolean;
}

class BioContentOrderItemDto {
  @IsIn(["link", "widget", "gallery", "social", "divider", "bank-details"])
  type: "link" | "widget" | "gallery" | "social" | "divider" | "bank-details";

  @IsString()
  @MaxLength(80)
  id: string;
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
  @MaxLength(32)
  backgroundFileId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  selectedBackgroundId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  avatarFileId?: string;
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
  @ValidateNested({ each: true })
  @Type(() => BioGalleryBlockDto)
  galleries: BioGalleryBlockDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BioDividerBlockDto)
  dividers: BioDividerBlockDto[] = [];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BioBankDetailsBlockDto)
  bankDetails: BioBankDetailsBlockDto[] = [];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BioContentOrderItemDto)
  contentOrder: BioContentOrderItemDto[];

  @IsArray()
  @IsString({ each: true })
  hiddenLinks: string[];

  @ValidateNested()
  @Type(() => BioAppearanceDto)
  appearance: BioAppearanceDto;
}
