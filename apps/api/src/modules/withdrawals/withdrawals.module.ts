import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { ReferralsModule } from "../referrals/referrals.module";
import { AdminWithdrawalsController } from "./admin-withdrawals.controller";
import { MemberWithdrawalsController } from "./member-withdrawals.controller";
import { WithdrawalsService } from "./withdrawals.service";

@Module({
  imports: [AuthModule, ReferralsModule],
  controllers: [AdminWithdrawalsController, MemberWithdrawalsController],
  providers: [WithdrawalsService],
})
export class WithdrawalsModule {}
