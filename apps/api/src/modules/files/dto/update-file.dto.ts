import { IsBoolean, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateFileDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
