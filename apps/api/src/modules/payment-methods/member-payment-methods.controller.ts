import {
  Body,
  Controller,
  Delete,
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
import {
  CreateUserPaymentMethodDto,
  UpdateUserPaymentMethodDto,
} from "./dto/save-user-payment-method.dto";
import { PaymentMethodsService } from "./payment-methods.service";

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller("member/payment-methods")
@UseGuards(JwtAccessGuard)
export class MemberPaymentMethodsController {
  constructor(private readonly paymentMethodsService: PaymentMethodsService) {}

  @Get()
  findDashboard(@Req() request: AuthenticatedRequest) {
    return this.paymentMethodsService.findDashboardForMember(request.user.id);
  }

  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateUserPaymentMethodDto,
  ) {
    return this.paymentMethodsService.createForMember(request.user.id, dto);
  }

  @Patch(":id")
  update(
    @Req() request: AuthenticatedRequest,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateUserPaymentMethodDto,
  ) {
    return this.paymentMethodsService.updateForMember(
      request.user.id,
      id,
      dto,
    );
  }

  @Delete(":id")
  remove(
    @Req() request: AuthenticatedRequest,
    @Param("id", ParseIntPipe) id: number,
  ) {
    return this.paymentMethodsService.removeForMember(request.user.id, id);
  }
}
