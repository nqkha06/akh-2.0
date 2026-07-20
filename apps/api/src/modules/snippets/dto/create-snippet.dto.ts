import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateSnippetDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100_000)
  content: string;
}
