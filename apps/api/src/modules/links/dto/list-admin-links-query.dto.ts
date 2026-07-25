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

const sortableColumns = [
  "createdAt",
  "updatedAt",
  "title",
  "status",
  "views",
] as const;
const statuses = ["active", "inactive", "paused"] as const;
const destinationTypes = ["url", "file", "snippet"] as const;
const deletionStates = ["active", "deleted"] as const;
const filterableColumns = [
  "title",
  "slug",
  "owner",
  "status",
  "destinationType",
  "deletedState",
  "views",
  "createdAt",
] as const;
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
const filterOperators = [
  "iLike",
  "notILike",
  "eq",
  "ne",
  "inArray",
  "notInArray",
  "isEmpty",
  "isNotEmpty",
  "lt",
  "lte",
  "gt",
  "gte",
  "isBetween",
  "isRelativeToToday",
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

export class AdminLinkSortDto {
  @IsIn(sortableColumns)
  id!: (typeof sortableColumns)[number];

  @IsBoolean()
  desc!: boolean;
}

export class AdminLinkFilterDto {
  @IsIn(filterableColumns)
  id!: (typeof filterableColumns)[number];

  @IsDefined()
  value!: string | string[];

  @IsIn(filterVariants)
  variant!: (typeof filterVariants)[number];

  @IsIn(filterOperators)
  operator!: (typeof filterOperators)[number];

  @IsString()
  @MaxLength(64)
  filterId!: string;
}

export class ListAdminLinksQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(254)
  owner?: string;

  @IsOptional()
  @Transform(({ value }) => parseCsv(value))
  @IsArray()
  @ArrayMaxSize(statuses.length)
  @IsIn(statuses, { each: true })
  status?: Array<(typeof statuses)[number]>;

  @IsOptional()
  @Transform(({ value }) => parseCsv(value))
  @IsArray()
  @ArrayMaxSize(destinationTypes.length)
  @IsIn(destinationTypes, { each: true })
  destinationType?: Array<(typeof destinationTypes)[number]>;

  @IsOptional()
  @Transform(({ value }) => parseCsv(value))
  @IsArray()
  @ArrayMaxSize(deletionStates.length)
  @IsIn(deletionStates, { each: true })
  deletedState: Array<(typeof deletionStates)[number]> = ["active"];

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
      ? parsed.map((item) => plainToInstance(AdminLinkSortDto, item))
      : parsed;
  })
  @IsArray()
  @ArrayMaxSize(3)
  @ValidateNested({ each: true })
  @Type(() => AdminLinkSortDto)
  sort?: AdminLinkSortDto[];

  @IsOptional()
  @Transform(({ value }) => {
    const parsed = parseJson(value);
    return Array.isArray(parsed)
      ? parsed.map((item) => plainToInstance(AdminLinkFilterDto, item))
      : parsed;
  })
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => AdminLinkFilterDto)
  filters?: AdminLinkFilterDto[];

  @IsOptional()
  @IsIn(["and", "or"])
  joinOperator: "and" | "or" = "and";
}
