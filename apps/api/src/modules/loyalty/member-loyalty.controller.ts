import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";

import type { AuthenticatedUser } from "../auth/auth.types";
import { JwtAccessGuard } from "../auth/guards/jwt-access.guard";
import { MemberLoyaltyQueryDto } from "./dto/member-loyalty-query.dto";
import { LoyaltyService } from "./loyalty.service";

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller("member/loyalty")
@UseGuards(JwtAccessGuard)
export class MemberLoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get()
  overview(
    @Req() request: AuthenticatedRequest,
    @Query() query: MemberLoyaltyQueryDto,
  ) {
    return this.loyaltyService.getMemberOverview(
      request.user.id,
      query.locale,
    );
  }
}
