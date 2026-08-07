import { IsString, Matches, MaxLength, MinLength } from "class-validator";

export class ResetPasswordDto {
  @IsString()
  @MinLength(32)
  @MaxLength(256)
  token!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: "Mật khẩu phải có chữ hoa, chữ thường và chữ số.",
  })
  password!: string;
}
