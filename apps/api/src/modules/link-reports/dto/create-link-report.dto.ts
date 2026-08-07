import { Transform } from "class-transformer";
import {
  IsEmail,
  IsIn,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

import { LINK_REPORT_REASONS } from "../link-report.constants";

export class CreateLinkReportDto {
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: "Email chưa đúng định dạng." })
  @MaxLength(320)
  email!: string;

  @Transform(({ value }) =>
    typeof value === "string" ? value.trim() : value,
  )
  @IsString()
  @MaxLength(500)
  reportedUrl!: string;

  @IsIn(LINK_REPORT_REASONS)
  reason!: (typeof LINK_REPORT_REASONS)[number];

  @Transform(({ value }) =>
    typeof value === "string" ? value.trim() : value,
  )
  @IsString()
  @MinLength(20)
  @MaxLength(5_000)
  details!: string;
}
