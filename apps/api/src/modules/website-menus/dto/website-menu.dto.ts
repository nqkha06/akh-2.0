import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";

import {
  WEBSITE_MENU_MAX_ITEMS,
  websiteMenuItemTypes,
  websiteMenuLocations,
  websiteMenuTargets,
} from "../website-menus.constants";

export class WebsiteMenuTranslationDto {
  @IsString()
  @Matches(/^[a-z]{2,3}(?:-[A-Z]{2})?$/)
  locale!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;
}

export class WebsiteMenuItemTranslationDto {
  @IsString()
  @Matches(/^[a-z]{2,3}(?:-[A-Z]{2})?$/)
  locale!: string;

  @IsString()
  @MaxLength(100)
  label!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  ariaLabel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  urlOverride?: string;
}

export class WebsiteMenuTreeItemDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  id?: number;

  @IsIn(websiteMenuItemTypes)
  type!: (typeof websiteMenuItemTypes)[number];

  @IsOptional()
  @IsInt()
  @Min(1)
  pageId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  url?: string;

  @IsIn(websiteMenuTargets)
  target!: (typeof websiteMenuTargets)[number];

  @IsOptional()
  @IsString()
  @MaxLength(100)
  rel?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]{1,50}$/)
  iconKey?: string;

  @IsBoolean()
  isEnabled!: boolean;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => WebsiteMenuItemTranslationDto)
  translations!: WebsiteMenuItemTranslationDto[];

  @IsArray()
  @ArrayMaxSize(WEBSITE_MENU_MAX_ITEMS)
  @ValidateNested({ each: true })
  @Type(() => WebsiteMenuTreeItemDto)
  children!: WebsiteMenuTreeItemDto[];
}

export class CreateWebsiteMenuDto {
  @IsString()
  @Matches(/^[a-z][a-z0-9-]{1,49}$/)
  key!: string;

  @IsString()
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => WebsiteMenuTranslationDto)
  translations!: WebsiteMenuTranslationDto[];
}

export class UpdateWebsiteMenuDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => WebsiteMenuTranslationDto)
  translations?: WebsiteMenuTranslationDto[];
}

export class ReplaceWebsiteMenuTreeDto {
  @IsInt()
  @Min(1)
  expectedVersion!: number;

  @IsArray()
  @ArrayMaxSize(WEBSITE_MENU_MAX_ITEMS)
  @ValidateNested({ each: true })
  @Type(() => WebsiteMenuTreeItemDto)
  items!: WebsiteMenuTreeItemDto[];
}

export class AssignWebsiteMenuLocationDto {
  @IsIn(websiteMenuLocations)
  location!: (typeof websiteMenuLocations)[number];

  @IsInt()
  @Min(1)
  menuId!: number;
}

export class PublicWebsiteMenusQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(250)
  locations?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  locale?: string;
}
