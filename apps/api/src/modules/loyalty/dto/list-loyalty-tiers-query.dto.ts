import { plainToInstance, Transform, Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";

import { publicationStatuses } from "../../../common/constants/publication-status";

const sortableColumns = [
  "key",
  "minimumValidViews",
  "sortOrder",
  "status",
  "createdAt",
  "updatedAt",
] as const;

function parseCsv(value: unknown) {
  const values = Array.isArray(value) ? value : String(value || "").split(",");
  return values.map((item) => String(item).trim()).filter(Boolean);
}

function parseJson(value: unknown) {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export class LoyaltyTierSortDto {
  @IsIn(sortableColumns)
  id!: (typeof sortableColumns)[number];

  @IsBoolean()
  desc!: boolean;
}

export class ListLoyaltyTiersQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @Transform(({ value }) => parseCsv(value))
  @IsArray()
  @ArrayMaxSize(publicationStatuses.length)
  @IsIn(publicationStatuses, { each: true })
  status?: Array<(typeof publicationStatuses)[number]>;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  perPage = 10;

  @IsOptional()
  @Transform(({ value }) => {
    const parsed = parseJson(value);
    return Array.isArray(parsed)
      ? parsed.map((item) => plainToInstance(LoyaltyTierSortDto, item))
      : parsed;
  })
  @IsArray()
  @ArrayMaxSize(3)
  @ValidateNested({ each: true })
  @Type(() => LoyaltyTierSortDto)
  sort?: LoyaltyTierSortDto[];

  @IsOptional()
  @IsIn(sortableColumns)
  sortBy: (typeof sortableColumns)[number] = "sortOrder";

  @IsOptional()
  @IsIn(["asc", "desc"])
  sortOrder: "asc" | "desc" = "asc";
}
