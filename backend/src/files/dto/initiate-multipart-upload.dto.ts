import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export const MAX_FILE_UPLOAD_SIZE = 100 * 1024 * 1024;

export class InitiateMultipartUploadDto {
  @IsString()
  @MaxLength(255)
  fileName: string;

  @IsString()
  @MaxLength(255)
  mimeType: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_FILE_UPLOAD_SIZE)
  size: number;

  @IsOptional()
  @IsIn(["file", "cover"])
  purpose?: "file" | "cover";
}
