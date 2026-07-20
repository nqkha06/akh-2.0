import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export const withdrawalStatuses = [
  "pending",
  "processing",
  "paid",
  "rejected",
  "cancelled",
] as const;

export const withdrawalSortFields = [
  "id",
  "amount",
  "netAmount",
  "status",
  "createdAt",
  "processedAt",
] as const;

export class ListWithdrawalsQueryDto {
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string"
      ? value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : value,
  )
  @IsArray()
  @IsIn(withdrawalStatuses, { each: true })
  status?: (typeof withdrawalStatuses)[number][];

  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsIn(withdrawalSortFields)
  sortBy: (typeof withdrawalSortFields)[number] = "createdAt";

  @IsOptional()
  @IsIn(["asc", "desc"])
  sortOrder: "asc" | "desc" = "desc";

  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  perPage = 20;
}
