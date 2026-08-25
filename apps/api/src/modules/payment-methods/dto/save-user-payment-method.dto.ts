import { Type } from "class-transformer";
import { IsInt, IsObject, IsOptional, Min } from "class-validator";

export class CreateUserPaymentMethodDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  paymentMethodId!: number;

  @IsObject()
  details!: Record<string, unknown>;
}

export class UpdateUserPaymentMethodDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  paymentMethodId?: number;

  @IsObject()
  details!: Record<string, unknown>;
}
