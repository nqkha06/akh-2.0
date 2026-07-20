import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from "class-validator";

import { PaymentMethodTranslationDto } from "./payment-method-translation.dto";

export class UpdatePaymentMethodDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{1,18}(?:\.\d{1,10})?$/)
  withdrawFee?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{1,18}(?:\.\d{1,10})?$/)
  minWithdrawAmount?: string;

  @IsOptional()
  @IsIn(["active", "inactive"])
  status?: "active" | "inactive";

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => PaymentMethodTranslationDto)
  translations?: PaymentMethodTranslationDto[];
}
