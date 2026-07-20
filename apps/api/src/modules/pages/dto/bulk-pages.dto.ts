import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  Min,
} from "class-validator";

import { PAGE_STATUSES, type PageStatus } from "../pages.constants";

export class BulkPagesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  ids!: number[];
}

export class BulkUpdatePagesStatusDto extends BulkPagesDto {
  @IsIn(PAGE_STATUSES)
  status!: PageStatus;
}
