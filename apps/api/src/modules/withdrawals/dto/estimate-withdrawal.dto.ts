import { Type } from "class-transformer";
import { IsInt, IsString, Matches, MaxLength, Min } from "class-validator";

export class EstimateWithdrawalDto {
  @IsString()
  @MaxLength(30)
  @Matches(/^\d+(?:\.\d{1,2})?$/, {
    message: "Số tiền phải là số dương và có tối đa 2 chữ số thập phân.",
  })
  amount!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  userPaymentMethodId!: number;
}
