import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class LoginDto {
  @IsEmail({}, { message: "Email chưa đúng định dạng." })
  @MaxLength(255)
  email!: string;

  @IsString()
  @MinLength(8, { message: "Mật khẩu cần có ít nhất 8 ký tự." })
  @MaxLength(128)
  password!: string;

  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}
