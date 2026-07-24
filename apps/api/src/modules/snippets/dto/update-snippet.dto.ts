import { Transform } from "class-transformer";
import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateSnippetDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100_000)
  content?: string;
}
