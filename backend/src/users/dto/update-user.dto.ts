import { Transform } from "class-transformer";
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  name?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: "Mật khẩu phải có chữ hoa, chữ thường và chữ số.",
  })
  password?: string;

  @IsOptional()
  @IsIn(["admin", "member"])
  role?: "admin" | "member";

  @IsOptional()
  @IsIn(["active", "inactive", "locked", "suspended", "disabled"])
  status?: "active" | "inactive" | "locked" | "suspended" | "disabled";
}
