import { Controller, Get, Param, ParseIntPipe } from "@nestjs/common";

import { MonetizationLevelsService } from "./monetization-levels.service";

@Controller("public/monetization-levels")
export class PublicMonetizationLevelsController {
  constructor(
    private readonly monetizationLevelsService: MonetizationLevelsService,
  ) {}

  @Get(":id/payout-rates")
  findPayoutRates(@Param("id", ParseIntPipe) id: number) {
    return this.monetizationLevelsService.findPublishedPayoutRates(id);
  }
}
