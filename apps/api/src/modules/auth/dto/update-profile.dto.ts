import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim() : value,
  )
  name?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === "true")
  removeAvatar?: boolean;
}
