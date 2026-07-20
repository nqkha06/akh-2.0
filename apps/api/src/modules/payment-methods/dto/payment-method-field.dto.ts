import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from "class-validator";

export const paymentMethodFieldTypes = [
  "text",
  "email",
  "tel",
  "number",
  "textarea",
] as const;

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
}
