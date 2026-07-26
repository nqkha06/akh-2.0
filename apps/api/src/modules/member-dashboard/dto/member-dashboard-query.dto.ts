import { IsIn, IsOptional } from "class-validator";

export const memberDashboardRanges = [
  "today",
  "yesterday",
  "7d",
  "30d",
  "60d",
  "90d",
] as const;

export type MemberDashboardRange = (typeof memberDashboardRanges)[number];

export class MemberDashboardQueryDto {
  @IsOptional()
  @IsIn(memberDashboardRanges)
  range: MemberDashboardRange = "30d";
}
