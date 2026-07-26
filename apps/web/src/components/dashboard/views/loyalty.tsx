import { useTranslations } from "next-intl";

import { LoyaltyHistory } from "@/components/dashboard/loyalty/loyalty-history";
import { LoyaltyOverview } from "@/components/dashboard/loyalty/loyalty-overview";
import { LoyaltyTierGrid } from "@/components/dashboard/loyalty/loyalty-tiers";
import { PageContainer, PageHeader } from "@/components/dashboard/ui";

export function LoyaltyView() {
  const t = useTranslations("SimplePages.loyalty");

  return (
    <PageContainer>
      <PageHeader title={t("title")} />

      <div className="grid w-full gap-5 text-foreground">
        <LoyaltyOverview />
        <LoyaltyTierGrid />
        <LoyaltyHistory />
      </div>
    </PageContainer>
  );
}
