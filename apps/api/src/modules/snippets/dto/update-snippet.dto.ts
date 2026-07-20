import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateSnippetDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100_000)
  content?: string;
}
