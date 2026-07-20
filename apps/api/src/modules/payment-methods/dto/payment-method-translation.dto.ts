import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  Matches,
  IsString,
  MaxLength,
  ValidateNested,
} from "class-validator";

import { PaymentMethodFieldDto } from "./payment-method-field.dto";

export class PaymentMethodTranslationDto {
  @Matches(/^[a-z]{2,3}(?:-[A-Z]{2})?$/)
  locale!: string;

  @IsString()
  @MaxLength(120)
  name!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => PaymentMethodFieldDto)
  fields!: PaymentMethodFieldDto[];
}
