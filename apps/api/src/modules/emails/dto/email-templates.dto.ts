import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";

import {
  EMAIL_CATEGORIES,
  EMAIL_TEMPLATE_STATUSES,
  EMAIL_VARIABLE_TYPES,
} from "../email.constants";

export class EmailTemplateVariableDto {
  @IsString()
  @Matches(/^[a-zA-Z][a-zA-Z0-9]*(?:\.[a-zA-Z][a-zA-Z0-9]*)*$/)
  @MaxLength(120)
  key!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  label!: string;

  @IsIn(EMAIL_VARIABLE_TYPES)
  type!: (typeof EMAIL_VARIABLE_TYPES)[number];

  @IsBoolean()
  required!: boolean;

  @IsOptional()
  example?: string | number | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;
}

export class CreateEmailTemplateDto {
  @IsString()
  @Matches(/^[a-z][a-z0-9_]{2,79}$/)
  code!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(160)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @IsIn(EMAIL_CATEGORIES)
  category!: (typeof EMAIL_CATEGORIES)[number];

  @IsIn(EMAIL_TEMPLATE_STATUSES)
  status!: (typeof EMAIL_TEMPLATE_STATUSES)[number];

  @IsString()
  @MinLength(1)
  @MaxLength(998)
  subject!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  preheader?: string | null;

  @IsString()
  @MinLength(1)
  @MaxLength(500_000)
  htmlContent!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200_000)
  textContent?: string | null;

  @IsArray()
  @ArrayMaxSize(100)
  @ArrayUnique((variable: EmailTemplateVariableDto) => variable.key)
  @ValidateNested({ each: true })
  @Type(() => EmailTemplateVariableDto)
  variables!: EmailTemplateVariableDto[];

  @IsOptional()
  @IsInt()
  @Min(1)
  senderId?: number | null;
}

export class UpdateEmailTemplateDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @IsOptional()
  @IsIn(EMAIL_CATEGORIES)
  category?: (typeof EMAIL_CATEGORIES)[number];

  @IsOptional()
  @IsIn(EMAIL_TEMPLATE_STATUSES)
  status?: (typeof EMAIL_TEMPLATE_STATUSES)[number];

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(998)
  subject?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  preheader?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500_000)
  htmlContent?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200_000)
  textContent?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ArrayUnique((variable: EmailTemplateVariableDto) => variable.key)
  @ValidateNested({ each: true })
  @Type(() => EmailTemplateVariableDto)
  variables?: EmailTemplateVariableDto[];

  @IsOptional()
  @IsInt()
  @Min(1)
  senderId?: number | null;
}

export class ListEmailTemplatesQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @IsOptional()
  @IsIn(EMAIL_CATEGORIES)
  category?: (typeof EMAIL_CATEGORIES)[number];

  @IsOptional()
  @IsIn(EMAIL_TEMPLATE_STATUSES)
  status?: (typeof EMAIL_TEMPLATE_STATUSES)[number];

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

export class PreviewEmailTemplateDto {
  @IsOptional()
  @IsObject()
  sampleData?: Record<string, unknown>;
}

export class TestSendEmailTemplateDto extends PreviewEmailTemplateDto {
  @IsEmail()
  @MaxLength(320)
  recipientEmail!: string;
}
