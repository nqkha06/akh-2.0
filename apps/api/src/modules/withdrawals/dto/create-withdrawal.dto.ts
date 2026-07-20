import { IsString, Matches, MaxLength, MinLength } from "class-validator";

import { EstimateWithdrawalDto } from "./estimate-withdrawal.dto";

export class CreateWithdrawalDto extends EstimateWithdrawalDto {
  @IsString()
  @MinLength(16)
  @MaxLength(100)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: "Idempotency key không hợp lệ.",
  })
  idempotencyKey!: string;
}
