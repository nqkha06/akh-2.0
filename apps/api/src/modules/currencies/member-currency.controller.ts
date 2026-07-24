import { Body, Controller, Get, Patch, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";

import type { AuthenticatedUser } from "../auth/auth.types";
import { JwtAccessGuard } from "../auth/guards/jwt-access.guard";
import { CurrenciesService } from "./currencies.service";
import { UpdateMemberCurrencyDto } from "./dto/update-member-currency.dto";

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller("member/preferences/currency")
@UseGuards(JwtAccessGuard)
export class MemberCurrencyController {
  constructor(private readonly currenciesService: CurrenciesService) {}

  @Get()
  get(@Req() request: AuthenticatedRequest) {
    return this.currenciesService.findMemberPreferences(request.user.id);
  }

  @Patch()
  update(
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdateMemberCurrencyDto,
  ) {
    return this.currenciesService.updateMemberCurrency(
      request.user.id,
      dto.currency,
    );
  }
}
