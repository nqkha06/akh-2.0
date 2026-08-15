import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";

import { CurrentUser } from "../../common/http/current-user.decorator";
import type { AuthenticatedUser } from "../auth/auth.types";
import { JwtAccessGuard } from "../auth/guards/jwt-access.guard";
import { SelectMonetizationLevelDto } from "./dto/select-monetization-level.dto";
import { MonetizationLevelsService } from "./monetization-levels.service";

@Controller("member/monetization-levels")
@UseGuards(JwtAccessGuard)
export class MemberMonetizationLevelsController {
  constructor(
    private readonly monetizationLevelsService: MonetizationLevelsService,
  ) {}

  @Get()
  findAvailable(@CurrentUser() user: AuthenticatedUser) {
    return this.monetizationLevelsService.findAvailableForMember(
      user.id,
    );
  }

  @Patch("selection")
  select(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SelectMonetizationLevelDto,
  ) {
    return this.monetizationLevelsService.selectForMember(
      user.id,
      dto.monetizationLevelId,
    );
  }
}
