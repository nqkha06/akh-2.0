import {
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from "class-validator";

export class UpdateAdminLinkDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  subtitle?: string;

  @IsOptional()
  @IsUrl({
    protocols: ["http", "https"],
    require_protocol: true,
    require_valid_protocol: true,
  })
  @MaxLength(2048)
  destinationUrl?: string;

  @IsOptional()
  @IsIn(["active", "inactive", "paused"])
  status?: "active" | "inactive" | "paused";
}
