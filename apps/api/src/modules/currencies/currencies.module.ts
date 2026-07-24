import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { AdminCurrenciesController } from "./admin-currencies.controller";
import { CurrenciesService } from "./currencies.service";
import { MemberCurrencyController } from "./member-currency.controller";

@Module({
  imports: [AuthModule],
  controllers: [AdminCurrenciesController, MemberCurrencyController],
  providers: [CurrenciesService],
  exports: [CurrenciesService],
})
export class CurrenciesModule {}
