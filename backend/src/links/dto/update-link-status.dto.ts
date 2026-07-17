import { IsIn } from "class-validator";

export class UpdateLinkStatusDto {
  @IsIn(["active", "inactive", "paused"])
  status: "active" | "inactive" | "paused";
}
