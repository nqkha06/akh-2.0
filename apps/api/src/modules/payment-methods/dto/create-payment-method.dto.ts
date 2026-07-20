import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsString,
  Matches,
  ValidateNested,
} from "class-validator";

import {
  publicationStatuses,
  type PublicationStatus,
} from "../../../common/constants/publication-status";
import { PaymentMethodTranslationDto } from "./payment-method-translation.dto";

export class CreatePaymentMethodDto {
  @IsString()
  @Matches(/^\d{1,18}(?:\.\d{1,10})?$/)
  withdrawFee!: string;

  @IsString()
  @Matches(/^\d{1,18}(?:\.\d{1,10})?$/)
  minWithdrawAmount!: string;

  @IsIn(publicationStatuses)
  status!: PublicationStatus;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => PaymentMethodTranslationDto)
  translations!: PaymentMethodTranslationDto[];
}
