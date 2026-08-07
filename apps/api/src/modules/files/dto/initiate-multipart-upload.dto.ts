import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";
import { ABSOLUTE_MEMBER_UPLOAD_MAX_BYTES } from "@stu/contracts";

// Absolute transport ceiling. The effective limit is managed in Business settings.

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
  @Max(ABSOLUTE_MEMBER_UPLOAD_MAX_BYTES)
  size: number;

  @IsOptional()
  @IsIn(["file", "cover"])
  purpose?: "file" | "cover";
}
