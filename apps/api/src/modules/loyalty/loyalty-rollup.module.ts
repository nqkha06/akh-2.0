import { Module } from "@nestjs/common";

import { LoyaltyRollupService } from "./loyalty-rollup.service";

@Module({
  providers: [LoyaltyRollupService],
  exports: [LoyaltyRollupService],
})
export class LoyaltyRollupModule {}
