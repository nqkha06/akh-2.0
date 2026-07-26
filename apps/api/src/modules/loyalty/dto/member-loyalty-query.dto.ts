import { IsOptional, IsString, Matches, MaxLength } from "class-validator";

export class MemberLoyaltyQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(35)
  @Matches(/^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i)
  locale?: string;
}
