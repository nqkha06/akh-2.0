import { Transform, Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

const nullableFolderId = ({ value }: { value: unknown }) =>
  value === "" || value === "root" || value === null ? null : value;

export class QueryAdminMediaDto {
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
  limit = 24;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @IsOptional()
  @IsIn([
    "image",
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/x-icon",
  ])
  type?: string;

  @IsOptional()
  @Transform(nullableFolderId)
  @IsString()
  @MaxLength(80)
  folderId?: string | null;

  @IsOptional()
  @IsIn(["createdAt", "fileName", "size", "mimeType"])
  sortBy: "createdAt" | "fileName" | "size" | "mimeType" = "createdAt";

  @IsOptional()
  @IsIn(["asc", "desc"])
  sortOrder: "asc" | "desc" = "desc";
}

export class UpdateAdminMediaDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fileName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  altText?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  caption?: string | null;
}

export class MoveAdminMediaDto {
  @IsOptional()
  @Transform(nullableFolderId)
  @IsString()
  @MaxLength(80)
  folderId?: string | null;
}

export class BulkAdminMediaDto {
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  ids!: string[];
}

export class BulkMoveAdminMediaDto extends BulkAdminMediaDto {
  @IsOptional()
  @Transform(nullableFolderId)
  @IsString()
  @MaxLength(80)
  folderId?: string | null;
}
