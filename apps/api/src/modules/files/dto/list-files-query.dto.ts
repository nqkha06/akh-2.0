import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class ListFilesQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsIn(["date", "name", "size", "downloads"])
  sort?: "date" | "name" | "size" | "downloads";

  @IsOptional()
  @IsIn(["asc", "desc"])
  direction?: "asc" | "desc";

  @IsOptional()
  @IsIn(["active", "trash"])
  status?: "active" | "trash";

  @IsOptional()
  @IsIn(["image", "video", "audio", "document", "archive", "other"])
  type?: "image" | "video" | "audio" | "document" | "archive" | "other";

  @IsOptional()
  @IsIn(["ready", "processing", "failed"])
  state?: "ready" | "processing" | "failed";

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
