import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";

import { CurrentUser } from "../../common/http/current-user.decorator";
import type { AuthenticatedUser } from "../auth/auth.types";
import { JwtAccessGuard } from "../auth/guards/jwt-access.guard";
import {
  CreateUserPaymentMethodDto,
  UpdateUserPaymentMethodDto,
} from "./dto/save-user-payment-method.dto";
import { PaymentMethodsService } from "./payment-methods.service";

@Controller("member/payment-methods")
@UseGuards(JwtAccessGuard)
export class MemberPaymentMethodsController {
  constructor(private readonly paymentMethodsService: PaymentMethodsService) {}

  @Get()
  findDashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.paymentMethodsService.findDashboardForMember(user.id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateUserPaymentMethodDto,
  ) {
    return this.paymentMethodsService.createForMember(user.id, dto);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateUserPaymentMethodDto,
  ) {
    return this.paymentMethodsService.updateForMember(
      user.id,
      id,
      dto,
    );
  }

  @Delete(":id")
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseIntPipe) id: number,
  ) {
    return this.paymentMethodsService.removeForMember(user.id, id);
  }
}
