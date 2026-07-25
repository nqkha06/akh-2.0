import { IsIn, IsOptional } from "class-validator";

export const adminDashboardRanges = ["7d", "30d", "90d"] as const;
export type AdminDashboardRange = (typeof adminDashboardRanges)[number];

export class AdminDashboardQueryDto {
  @IsOptional()
  @IsIn(adminDashboardRanges)
  range: AdminDashboardRange = "30d";
}
