import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

export class GoogleLoginDto {
  @IsString()
  @MinLength(20)
  idToken!: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(32)
  @Matches(/^[a-z0-9_-]+$/i, {
    message: "Mã giới thiệu không hợp lệ.",
  })
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  referralCode?: string;

  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}
