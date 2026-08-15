import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { validateEnvironment } from "./config/env.validation";

import { PrismaModule } from "./database/prisma/prisma.module";
import { AuditModule } from "./modules/audit/audit.module";
import { AdminMediaModule } from "./modules/admin-media/admin-media.module";
import { AnnouncementsModule } from "./modules/announcements/announcements.module";
import { AdminDashboardModule } from "./modules/admin-dashboard/admin-dashboard.module";
import { AuthModule } from "./modules/auth/auth.module";
import { AuthorizationModule } from "./modules/authorization/authorization.module";
import { BioPagesModule } from "./modules/bio-pages/bio-pages.module";
import { BusinessSettingsModule } from "./modules/business-settings/business-settings.module";
import { CurrenciesModule } from "./modules/currencies/currencies.module";
import { EmailsModule } from "./modules/emails/emails.module";
import { FilesModule } from "./modules/files/files.module";
import { LinksModule } from "./modules/links/links.module";
import { LanguagesModule } from "./modules/languages/languages.module";
import { LinkReportsModule } from "./modules/link-reports/link-reports.module";
import { LoyaltyModule } from "./modules/loyalty/loyalty.module";
import { MonetizationLevelsModule } from "./modules/monetization-levels/monetization-levels.module";
import { MemberDashboardModule } from "./modules/member-dashboard/member-dashboard.module";
import { PaymentMethodsModule } from "./modules/payment-methods/payment-methods.module";
import { PagesModule } from "./modules/pages/pages.module";
import { ReferralsModule } from "./modules/referrals/referrals.module";
import { SiteSettingsModule } from "./modules/site-settings/site-settings.module";
import { StuAccessLogsModule } from "./modules/stu-access-logs/stu-access-logs.module";
import { SnippetsModule } from "./modules/snippets/snippets.module";
import { SupportModule } from "./modules/support/support.module";
import { VisitAggregationSchedulerModule } from "./modules/system-jobs/visit-aggregation-scheduler.module";
import { LoyaltyRollupSchedulerModule } from "./modules/system-jobs/loyalty-rollup-scheduler.module";
import { UsersModule } from "./modules/users/users.module";
import { WithdrawalsModule } from "./modules/withdrawals/withdrawals.module";
import { WebsiteMenusModule } from "./modules/website-menus/website-menus.module";

const visitAggregationScheduler =
  process.env.QUEUE_ENABLED === "false"
    ? []
    : [VisitAggregationSchedulerModule, LoyaltyRollupSchedulerModule];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),
    PrismaModule,
    AuditModule,
    AdminDashboardModule,
    AdminMediaModule,
    AnnouncementsModule,
    AuthModule,
    AuthorizationModule,
    BioPagesModule,
    BusinessSettingsModule,
    CurrenciesModule,
    EmailsModule,
    FilesModule,
    LinksModule,
    LanguagesModule,
    LinkReportsModule,
    LoyaltyModule,
    MemberDashboardModule,
    MonetizationLevelsModule,
    PaymentMethodsModule,
    PagesModule,
    ReferralsModule,
    SiteSettingsModule,
    StuAccessLogsModule,
    SnippetsModule,
    SupportModule,
    ...visitAggregationScheduler,
    UsersModule,
    WithdrawalsModule,
    WebsiteMenusModule,
  ],
})
export class AppModule {}
