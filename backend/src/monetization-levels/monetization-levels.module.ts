import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { MemberMonetizationLevelsController } from "./member-monetization-levels.controller";
import { MonetizationLevelsController } from "./monetization-levels.controller";
import { MonetizationLevelsService } from "./monetization-levels.service";

@Module({
  imports: [AuthModule],
  controllers: [
    MonetizationLevelsController,
    MemberMonetizationLevelsController,
  ],
  providers: [MonetizationLevelsService],
})
export class MonetizationLevelsModule {}
