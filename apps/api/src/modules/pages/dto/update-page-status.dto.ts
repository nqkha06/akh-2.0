import { IsIn } from "class-validator";

import { PAGE_STATUSES, type PageStatus } from "../pages.constants";

export class UpdatePageStatusDto {
  @IsIn(PAGE_STATUSES)
  status!: PageStatus;
}
