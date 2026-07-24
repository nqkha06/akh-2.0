import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { validateEnvironment } from "./config/env.validation";

import { PrismaModule } from "./database/prisma/prisma.module";
import { AdminMediaModule } from "./modules/admin-media/admin-media.module";
import { AuthModule } from "./modules/auth/auth.module";
import { AuthorizationModule } from "./modules/authorization/authorization.module";
import { BioPagesModule } from "./modules/bio-pages/bio-pages.module";
import { CurrenciesModule } from "./modules/currencies/currencies.module";
import { FilesModule } from "./modules/files/files.module";
import { LinksModule } from "./modules/links/links.module";
import { LanguagesModule } from "./modules/languages/languages.module";
import { MonetizationLevelsModule } from "./modules/monetization-levels/monetization-levels.module";
import { PaymentMethodsModule } from "./modules/payment-methods/payment-methods.module";
import { PagesModule } from "./modules/pages/pages.module";
import { ReferralsModule } from "./modules/referrals/referrals.module";
import { SiteSettingsModule } from "./modules/site-settings/site-settings.module";
import { SnippetsModule } from "./modules/snippets/snippets.module";
import { SupportModule } from "./modules/support/support.module";
import { UsersModule } from "./modules/users/users.module";
import { WithdrawalsModule } from "./modules/withdrawals/withdrawals.module";
import { WebsiteMenusModule } from "./modules/website-menus/website-menus.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),
    PrismaModule,
    AdminMediaModule,
    AuthModule,
    AuthorizationModule,
    BioPagesModule,
    CurrenciesModule,
    FilesModule,
    LinksModule,
    LanguagesModule,
    MonetizationLevelsModule,
    PaymentMethodsModule,
    PagesModule,
    ReferralsModule,
    SiteSettingsModule,
    SnippetsModule,
    SupportModule,
    UsersModule,
    WithdrawalsModule,
    WebsiteMenusModule,
  ],
})
export class AppModule {}
