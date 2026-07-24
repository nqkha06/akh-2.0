import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export const supportTicketStatuses = [
  "submitted",
  "in_progress",
  "waiting_user",
  "answered",
  "resolved",
  "closed",
] as const;

export const supportTicketPriorities = [
  "low",
  "normal",
  "high",
  "urgent",
] as const;

export const supportTicketCategories = [
  "usage",
  "technical",
  "social_links",
  "files",
  "link_in_bio",
  "monetization",
  "withdrawal",
  "rewards",
  "account",
  "abuse",
  "other",
] as const;

export class CreateSupportTicketDto {
  @IsIn(supportTicketCategories)
  category!: (typeof supportTicketCategories)[number];

  @IsString()
  @MinLength(8)
  @MaxLength(160)
  subject!: string;

  @IsString()
  @MinLength(20)
  @MaxLength(10_000)
  content!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  relatedResource?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4_000)
  technicalInfo?: string;
}

export class ReplySupportTicketDto {
  @IsString()
  @MinLength(1)
  @MaxLength(10_000)
  content!: string;
}

export class UpdateSupportTicketDto {
  @IsOptional()
  @IsIn(supportTicketStatuses)
  status?: (typeof supportTicketStatuses)[number];

  @IsOptional()
  @IsIn(supportTicketPriorities)
  priority?: (typeof supportTicketPriorities)[number];

  @IsOptional()
  @Transform(({ value }) => value === true || value === "true")
  @IsBoolean()
  assignToMe?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === true || value === "true")
  @IsBoolean()
  unassign?: boolean;
}

export class ListSupportTicketsQueryDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsIn(supportTicketStatuses)
  status?: (typeof supportTicketStatuses)[number];

  @IsOptional()
  @IsIn(supportTicketPriorities)
  priority?: (typeof supportTicketPriorities)[number];

  @IsOptional()
  @IsIn(supportTicketCategories)
  category?: (typeof supportTicketCategories)[number];

  @IsOptional()
  @IsIn(["all", "mine", "unassigned"])
  assignment: "all" | "mine" | "unassigned" = "all";

  @IsOptional()
  @IsIn(["lastMessageAt", "createdAt", "priority", "status"])
  sortBy: "lastMessageAt" | "createdAt" | "priority" | "status" =
    "lastMessageAt";

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
