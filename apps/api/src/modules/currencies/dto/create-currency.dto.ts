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

import {
  CURRENCY_CODE_PATTERN,
  EXCHANGE_RATE_PATTERN,
} from "../currency.constants";

export class CreateCurrencyDto {
  @IsString()
  @Matches(CURRENCY_CODE_PATTERN, {
    message: "Mã tiền tệ phải gồm đúng 3 chữ cái in hoa.",
  })
  code!: string;

  @IsString()
  @MaxLength(100)
  name!: string;

  @IsString()
  @MaxLength(12)
  symbol!: string;

  @IsString()
  @Matches(EXCHANGE_RATE_PATTERN, {
    message: "Tỷ giá phải là số dương và có tối đa 8 chữ số thập phân.",
  })
  exchangeRate!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(4)
  decimalDigits!: number;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsBoolean()
  isActive!: boolean;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10_000)
  sortOrder!: number;
}
