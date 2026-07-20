import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";

import type { AuthenticatedUser } from "../auth/auth.types";
import { Permissions } from "../auth/decorators/permissions.decorator";
import { JwtAccessGuard } from "../auth/guards/jwt-access.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { ListWithdrawalsQueryDto } from "./dto/list-withdrawals-query.dto";
import { RejectWithdrawalDto } from "./dto/reject-withdrawal.dto";
import { WithdrawalsService } from "./withdrawals.service";

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller("admin/withdrawals")
@UseGuards(JwtAccessGuard, PermissionsGuard)
export class AdminWithdrawalsController {
  constructor(private readonly withdrawalsService: WithdrawalsService) {}

  @Get()
  @Permissions("withdrawals.read")
  findAll(@Query() query: ListWithdrawalsQueryDto) {
    return this.withdrawalsService.findAllForAdmin(query);
  }

  @Get(":id")
  @Permissions("withdrawals.read")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.withdrawalsService.findOneForAdmin(id);
  }

  @Patch(":id/process")
  @Permissions("withdrawals.process")
  process(
    @Req() request: AuthenticatedRequest,
    @Param("id", ParseIntPipe) id: number,
  ) {
    return this.withdrawalsService.process(id, request.user.id);
  }

  @Patch(":id/paid")
  @Permissions("withdrawals.process")
  markPaid(
    @Req() request: AuthenticatedRequest,
    @Param("id", ParseIntPipe) id: number,
  ) {
    return this.withdrawalsService.markPaid(id, request.user.id);
  }

  @Patch(":id/reject")
  @Permissions("withdrawals.process")
  reject(
    @Req() request: AuthenticatedRequest,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: RejectWithdrawalDto,
  ) {
    return this.withdrawalsService.reject(
      id,
      request.user.id,
      dto.statusReason,
    );
  }
}
