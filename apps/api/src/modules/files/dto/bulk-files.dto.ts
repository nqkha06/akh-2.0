import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsString } from "class-validator";

export class BulkFilesDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  ids: string[];
}
