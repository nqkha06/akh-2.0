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
  Min,
  ValidateNested,
} from "class-validator";

import {
  PAGE_FILTERABLE_COLUMNS,
  PAGE_FILTER_OPERATORS,
  PAGE_FILTER_VARIANTS,
  PAGE_SORTABLE_COLUMNS,
  PAGE_STATUSES,
} from "../pages.constants";

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

export class PageSortDto {
  @IsIn(PAGE_SORTABLE_COLUMNS)
  id!: (typeof PAGE_SORTABLE_COLUMNS)[number];

  @IsBoolean()
  desc!: boolean;
}

export class PageFilterDto {
  @IsIn(PAGE_FILTERABLE_COLUMNS)
  id!: (typeof PAGE_FILTERABLE_COLUMNS)[number];

  @IsDefined()
  value!: string | string[];

  @IsIn(PAGE_FILTER_VARIANTS)
  variant!: (typeof PAGE_FILTER_VARIANTS)[number];

  @IsIn(PAGE_FILTER_OPERATORS)
  operator!: (typeof PAGE_FILTER_OPERATORS)[number];

  @IsString()
  @MaxLength(64)
  filterId!: string;
}

export class QueryPagesDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @IsOptional()
  @Transform(({ value }) => parseCsv(value))
  @IsArray()
  @ArrayMaxSize(PAGE_STATUSES.length)
  @IsIn(PAGE_STATUSES, { each: true })
  status?: Array<(typeof PAGE_STATUSES)[number]>;

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
      ? parsed.map((item) => plainToInstance(PageSortDto, item))
      : parsed;
  })
  @IsArray()
  @ArrayMaxSize(3)
  @ValidateNested({ each: true })
  @Type(() => PageSortDto)
  sort?: PageSortDto[];

  @IsOptional()
  @Transform(({ value }) => {
    const parsed = parseJson(value);
    return Array.isArray(parsed)
      ? parsed.map((item) => plainToInstance(PageFilterDto, item))
      : parsed;
  })
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => PageFilterDto)
  filters?: PageFilterDto[];

  @IsOptional()
  @IsIn(["and", "or"])
  joinOperator: "and" | "or" = "and";
}
