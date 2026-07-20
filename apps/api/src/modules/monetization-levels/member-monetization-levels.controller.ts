import { Body, Controller, Get, Patch, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";

import type { AuthenticatedUser } from "../auth/auth.types";
import { JwtAccessGuard } from "../auth/guards/jwt-access.guard";
import { SelectMonetizationLevelDto } from "./dto/select-monetization-level.dto";
import { MonetizationLevelsService } from "./monetization-levels.service";

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller("member/monetization-levels")
@UseGuards(JwtAccessGuard)
export class MemberMonetizationLevelsController {
  constructor(
    private readonly monetizationLevelsService: MonetizationLevelsService,
  ) {}

  @Get()
  findAvailable(@Req() request: AuthenticatedRequest) {
    return this.monetizationLevelsService.findAvailableForMember(
      request.user.id,
    );
  }

  @Patch("selection")
  select(
    @Req() request: AuthenticatedRequest,
    @Body() dto: SelectMonetizationLevelDto,
  ) {
    return this.monetizationLevelsService.selectForMember(
      request.user.id,
      dto.monetizationLevelId,
    );
  }
}
