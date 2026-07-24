import { Type } from "class-transformer";
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export const snippetSortFields = ["name", "createdAt", "updatedAt"] as const;
export const snippetSortOrders = ["asc", "desc"] as const;

export type SnippetSortField = (typeof snippetSortFields)[number];
export type SnippetSortOrder = (typeof snippetSortOrders)[number];

export class ListSnippetsQueryDto {
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
  limit = 20;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsIn(snippetSortFields)
  sortBy: SnippetSortField = "createdAt";

  @IsOptional()
  @IsIn(snippetSortOrders)
  sortOrder: SnippetSortOrder = "desc";
}
