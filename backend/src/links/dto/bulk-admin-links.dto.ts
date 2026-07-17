import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  Min,
} from "class-validator";

export class BulkAdminLinksDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  ids!: number[];
}

export class BulkUpdateAdminLinksStatusDto extends BulkAdminLinksDto {
  @IsIn(["active", "inactive", "paused"])
  status!: "active" | "inactive" | "paused";
}
