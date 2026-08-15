import { Type } from "class-transformer";
import {
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

import { EMAIL_CATEGORIES, EMAIL_SENDER_STATUSES } from "../email.constants";

const DOMAIN_PATTERN = /^(?=.{4,253}$)(?!-)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;

export class CreateEmailSenderDto {
  @IsIn(EMAIL_CATEGORIES)
  type!: (typeof EMAIL_CATEGORIES)[number];

  @IsEmail()
  @MaxLength(320)
  emailAddress!: string;

  @IsString()
  @Matches(DOMAIN_PATTERN)
  @MaxLength(253)
  domain!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  displayName!: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  replyToEmail?: string | null;
}

export class UpdateEmailSenderDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  displayName?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  replyToEmail?: string | null;

  @IsOptional()
  @IsIn(EMAIL_SENDER_STATUSES)
  status?: (typeof EMAIL_SENDER_STATUSES)[number];
}

export class ListEmailSendersQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @IsOptional()
  @IsIn(EMAIL_CATEGORIES)
  type?: (typeof EMAIL_CATEGORIES)[number];

  @IsOptional()
  @IsIn(EMAIL_SENDER_STATUSES)
  status?: (typeof EMAIL_SENDER_STATUSES)[number];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  perPage = 20;
}
