import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, MaxLength } from "class-validator";

import { EMAIL_PROVIDERS } from "../email.constants";

export class UpdateEmailSettingsDto {
  @IsOptional()
  @IsIn(EMAIL_PROVIDERS)
  provider?: (typeof EMAIL_PROVIDERS)[number];

  @IsOptional()
  @IsString()
  @MaxLength(20)
  defaultLocale?: string;

  @IsOptional()
  @IsBoolean()
  transactionalEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  marketingEnabled?: boolean;

  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  globalReplyToEmail?: string | null;

  @IsOptional()
  @IsBoolean()
  trackingEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  openTrackingEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  clickTrackingEnabled?: boolean;
}
