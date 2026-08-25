import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";

class BackgroundImagePresetDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  id!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsUrl({ protocols: ["https"], require_protocol: true })
  @MaxLength(2_000)
  imageUrl!: string;

  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  categories!: string[];

  @IsBoolean()
  enabled!: boolean;
}

class BackgroundVideoPresetDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  id!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  source!: string;

  @IsUrl({ protocols: ["https"], require_protocol: true })
  @MaxLength(2_000)
  sourceUrl!: string;

  @IsUrl({ protocols: ["https"], require_protocol: true })
  @MaxLength(2_000)
  videoUrl!: string;

  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  categories!: string[];

  @IsBoolean()
  enabled!: boolean;
}

export class UpdateBusinessSettingsDto {
  @IsInt()
  @Min(1)
  version!: number;

  @IsBoolean()
  registrationEnabled!: boolean;

  @IsBoolean()
  emailVerificationRequired!: boolean;

  @IsBoolean()
  googleLoginEnabled!: boolean;

  @Matches(/^[A-Z]{3}$/)
  baseCurrencyCode!: string;

  @Matches(/^[A-Z]{3}$/)
  withdrawalCurrencyCode!: string;

  @Matches(/^\d{1,2}(\.\d{1,2})?$/)
  referralCommissionRate!: string;

  @IsInt()
  @Min(1)
  @Max(365)
  loyaltyWindowDays!: number;

  @IsInt()
  @Min(1)
  @Max(365)
  loyaltyHistoryDays!: number;

  @IsInt()
  @Min(1_048_576)
  @Max(1_073_741_824)
  memberFileMaxBytes!: number;

  @IsInt()
  @Min(1_048_576)
  @Max(104_857_600)
  coverImageMaxBytes!: number;

  @IsInt()
  @Min(1_048_576)
  @Max(104_857_600)
  adminMediaMaxBytes!: number;

  @IsInt()
  @Min(1_048_576)
  @Max(104_857_600)
  supportAttachmentMaxBytes!: number;

  @IsInt()
  @Min(1_048_576)
  @Max(1_099_511_627_776)
  memberStorageQuotaBytes!: number;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @Matches(/^[a-z0-9][a-z0-9.+-]*\/[a-z0-9][a-z0-9.+-]*$/i, { each: true })
  uploadAllowedMimeTypes!: string[];

  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => BackgroundImagePresetDto)
  backgroundImages!: BackgroundImagePresetDto[];

  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => BackgroundVideoPresetDto)
  backgroundVideos!: BackgroundVideoPresetDto[];

  @IsBoolean()
  maintenanceMode!: boolean;

  @IsBoolean()
  withdrawalsPaused!: boolean;

  @IsBoolean()
  requireWithdrawalTrafficSource!: boolean;
}
