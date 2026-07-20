import { Transform, Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsString,
  Matches,
  MaxLength,
  Min,
} from "class-validator";

import { USER_STATUSES, type UserStatus } from "../users.constants";

export class UserIdsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  ids!: number[];
}

export class UpdateUserStatusDto {
  @IsIn(USER_STATUSES)
  status!: UserStatus;
}

export class BulkUpdateUserStatusDto extends UserIdsDto {
  @IsIn(USER_STATUSES)
  status!: UserStatus;
}

export class UpdateUserAccessDto {
  @Transform(({ value }) =>
    Array.isArray(value)
      ? [...new Set(value.map((item) => String(item).trim()).filter(Boolean))]
      : value,
  )
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @Matches(/^[a-z][a-z0-9-]{1,49}$/, { each: true })
  roles!: string[];

  @Transform(({ value }) =>
    Array.isArray(value)
      ? [...new Set(value.map((item) => String(item).trim()).filter(Boolean))]
      : value,
  )
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  @Matches(/^[a-z][a-z0-9.-]{1,99}$/, { each: true })
  permissions!: string[];
}
