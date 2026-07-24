import { Transform } from "class-transformer";
import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateSnippetDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MaxLength(120)
  name?: string;

  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100_000)
  content: string;
}
