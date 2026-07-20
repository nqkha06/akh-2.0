import { Type } from "class-transformer";
import { IsInt, Min } from "class-validator";

export class SelectMonetizationLevelDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  monetizationLevelId!: number;
}
