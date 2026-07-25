import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";

import type { AuthenticatedUser } from "../auth/auth.types";
import { JwtAccessGuard } from "../auth/guards/jwt-access.guard";
import { MemberDashboardService } from "./member-dashboard.service";

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller("member/dashboard")
@UseGuards(JwtAccessGuard)
export class MemberDashboardController {
  constructor(private readonly dashboard: MemberDashboardService) {}

  @Get()
  overview(@Req() request: AuthenticatedRequest) {
    return this.dashboard.overview(request.user.id);
  }
}
