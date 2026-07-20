import { plainToInstance, Transform, Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDefined,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Matches,
  Min,
  ValidateNested,
} from "class-validator";

import {
  USER_FILTERABLE_COLUMNS,
  USER_FILTER_OPERATORS,
  USER_SORTABLE_COLUMNS,
  USER_STATUSES,
} from "../users.constants";

const filterVariants = [
  "text",
  "number",
  "range",
  "date",
  "dateRange",
  "boolean",
  "select",
  "multiSelect",
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

export class UserSortDto {
  @IsIn(USER_SORTABLE_COLUMNS)
  id!: (typeof USER_SORTABLE_COLUMNS)[number];

  @IsBoolean()
  desc!: boolean;
}

export class UserFilterDto {
  @IsIn(USER_FILTERABLE_COLUMNS)
  id!: (typeof USER_FILTERABLE_COLUMNS)[number];

  @IsDefined()
  value!: string | string[];

  @IsIn(filterVariants)
  variant!: (typeof filterVariants)[number];

  @IsIn(USER_FILTER_OPERATORS)
  operator!: (typeof USER_FILTER_OPERATORS)[number];

  @IsString()
  @MaxLength(64)
  filterId!: string;
}

export class ListUsersQueryDto {
  /** Legacy global search key. */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  /** tablecn text filter; searches both name and email. */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(254)
  email?: string;

  @IsOptional()
  @Transform(({ value }) => parseCsv(value))
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @Matches(/^[a-z][a-z0-9-]{1,49}$/, { each: true })
  role?: string[];

  @IsOptional()
  @Transform(({ value }) => parseCsv(value))
  @IsArray()
  @ArrayMaxSize(USER_STATUSES.length)
  @IsIn(USER_STATUSES, { each: true })
  status?: Array<(typeof USER_STATUSES)[number]>;

  @IsOptional()
  @IsIn(["verified", "unverified"])
  emailVerified?: "verified" | "unverified";

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  /** tablecn page-size key. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  perPage?: number;

  /** Legacy page-size key. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  /** tablecn format: [{"id":"createdAt","desc":true}] */
  @IsOptional()
  @Transform(({ value }) => {
    const parsed = parseJson(value);
    return Array.isArray(parsed)
      ? parsed.map((item) => plainToInstance(UserSortDto, item))
      : parsed;
  })
  @IsArray()
  @ArrayMaxSize(3)
  @ValidateNested({ each: true })
  @Type(() => UserSortDto)
  sort?: UserSortDto[];

  /** tablecn advanced-filter format. */
  @IsOptional()
  @Transform(({ value }) => {
    const parsed = parseJson(value);
    return Array.isArray(parsed)
      ? parsed.map((item) => plainToInstance(UserFilterDto, item))
      : parsed;
  })
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => UserFilterDto)
  filters?: UserFilterDto[];

  @IsOptional()
  @IsIn(["and", "or"])
  joinOperator: "and" | "or" = "and";

  /** Legacy sort keys retained for existing clients. */
  @IsOptional()
  @IsIn(USER_SORTABLE_COLUMNS)
  sortBy: (typeof USER_SORTABLE_COLUMNS)[number] = "createdAt";

  @IsOptional()
  @IsIn(["asc", "desc"])
  sortOrder: "asc" | "desc" = "desc";
}
