import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from "class-validator";

export const paymentMethodFieldTypes = [
  "text",
  "email",
  "tel",
  "number",
  "textarea",
  "select",
] as const;

export class PaymentMethodFieldOptionDto {
  @IsString()
  @MaxLength(100)
  value!: string;

  @IsString()
  @MaxLength(180)
  label!: string;
}

export class PaymentMethodFieldDto {
  @IsString()
  @Matches(/^[a-z][a-zA-Z0-9_]{0,63}$/)
  key!: string;

  @IsString()
  @MaxLength(100)
  label!: string;

  @IsIn(paymentMethodFieldTypes)
  type!: (typeof paymentMethodFieldTypes)[number];

  @IsBoolean()
  required!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  placeholder?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => PaymentMethodFieldOptionDto)
  options?: PaymentMethodFieldOptionDto[];
}
