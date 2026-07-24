import { Type } from "class-transformer";
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from "class-validator";

import { EXCHANGE_RATE_PATTERN } from "../currency.constants";

export class UpdateCurrencyDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(12)
  symbol?: string;

  @IsOptional()
  @IsString()
  @Matches(EXCHANGE_RATE_PATTERN, {
    message: "Tỷ giá phải là số dương và có tối đa 8 chữ số thập phân.",
  })
  exchangeRate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(4)
  decimalDigits?: number;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10_000)
  sortOrder?: number;
}
