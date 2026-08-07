import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { LanguagesModule } from "../languages/languages.module";
import { AdminLoyaltyTiersController } from "./admin-loyalty-tiers.controller";
import { MemberLoyaltyController } from "./member-loyalty.controller";
import { LoyaltyService } from "./loyalty.service";
import { LoyaltyRollupModule } from "./loyalty-rollup.module";

@Module({
  imports: [AuthModule, LanguagesModule, LoyaltyRollupModule],
  controllers: [AdminLoyaltyTiersController, MemberLoyaltyController],
  providers: [LoyaltyService],
})
export class LoyaltyModule {}
