import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { MemberReferralsController } from "./member-referrals.controller";
import { ReferralsService } from "./referrals.service";

@Module({
  imports: [AuthModule],
  controllers: [MemberReferralsController],
  providers: [ReferralsService],
  exports: [ReferralsService],
})
export class ReferralsModule {}
