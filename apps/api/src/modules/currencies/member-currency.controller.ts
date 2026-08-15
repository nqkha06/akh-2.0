import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";

import { CurrentUser } from "../../common/http/current-user.decorator";
import type { AuthenticatedUser } from "../auth/auth.types";
import { JwtAccessGuard } from "../auth/guards/jwt-access.guard";
import { CurrenciesService } from "./currencies.service";
import { UpdateMemberCurrencyDto } from "./dto/update-member-currency.dto";

@Controller("member/preferences/currency")
@UseGuards(JwtAccessGuard)
export class MemberCurrencyController {
  constructor(private readonly currenciesService: CurrenciesService) {}

  @Get()
  get(@CurrentUser() user: AuthenticatedUser) {
    return this.currenciesService.findMemberPreferences(user.id);
  }

  @Patch()
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateMemberCurrencyDto,
  ) {
    return this.currenciesService.updateMemberCurrency(
      user.id,
      dto.currency,
    );
  }
}
