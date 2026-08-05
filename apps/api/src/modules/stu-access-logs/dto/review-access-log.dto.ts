import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export class ReviewAccessLogDto {
  @IsIn(["safe", "suspicious", "follow_up"])
  status!: "safe" | "suspicious" | "follow_up";

  @IsOptional()
  @IsString()
  @MaxLength(1_000)
  note?: string;
}
