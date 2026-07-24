import { IsString, Matches } from "class-validator";

import { CURRENCY_CODE_PATTERN } from "../currency.constants";

export class UpdateMemberCurrencyDto {
  @IsString()
  @Matches(CURRENCY_CODE_PATTERN, {
    message: "Mã tiền tệ phải gồm đúng 3 chữ cái in hoa.",
  })
  currency!: string;
}
