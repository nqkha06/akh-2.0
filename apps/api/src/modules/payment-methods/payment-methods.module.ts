import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { LanguagesModule } from "../languages/languages.module";
import { AdminPaymentMethodsController } from "./admin-payment-methods.controller";
import { MemberPaymentMethodsController } from "./member-payment-methods.controller";
import { PaymentMethodsService } from "./payment-methods.service";

@Module({
  imports: [AuthModule, LanguagesModule],
  controllers: [
    AdminPaymentMethodsController,
    MemberPaymentMethodsController,
  ],
  providers: [PaymentMethodsService],
})
export class PaymentMethodsModule {}
