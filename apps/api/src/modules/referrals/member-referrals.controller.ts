import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";

import type { AuthenticatedUser } from "../auth/auth.types";
import { JwtAccessGuard } from "../auth/guards/jwt-access.guard";
import { ReferralsService } from "./referrals.service";

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller("member/referrals")
@UseGuards(JwtAccessGuard)
export class MemberReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  @Get("dashboard")
  dashboard(@Req() request: AuthenticatedRequest) {
    return this.referralsService.getMemberDashboard(request.user.id);
  }
}
