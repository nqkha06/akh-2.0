import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";

import type { AuthenticatedUser } from "../auth/auth.types";
import { JwtAccessGuard } from "../auth/guards/jwt-access.guard";
import { CreateWithdrawalDto } from "./dto/create-withdrawal.dto";
import { EstimateWithdrawalDto } from "./dto/estimate-withdrawal.dto";
import { WithdrawalsService } from "./withdrawals.service";

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller("member/withdrawals")
@UseGuards(JwtAccessGuard)
export class MemberWithdrawalsController {
  constructor(private readonly withdrawalsService: WithdrawalsService) {}

  @Get("dashboard")
  dashboard(@Req() request: AuthenticatedRequest) {
    return this.withdrawalsService.getMemberDashboard(request.user.id);
  }

  @Post("estimate")
  estimate(
    @Req() request: AuthenticatedRequest,
    @Body() dto: EstimateWithdrawalDto,
  ) {
    return this.withdrawalsService.estimate(request.user.id, dto);
  }

  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateWithdrawalDto,
  ) {
    return this.withdrawalsService.create(request.user.id, dto);
  }

  @Patch(":id/cancel")
  cancel(
    @Req() request: AuthenticatedRequest,
    @Param("id", ParseIntPipe) id: number,
  ) {
    return this.withdrawalsService.cancel(request.user.id, id);
  }
}
