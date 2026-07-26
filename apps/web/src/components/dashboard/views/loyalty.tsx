import { useTranslations } from "next-intl";

import { LoyaltyHistory } from "@/components/dashboard/loyalty/loyalty-history";
import { LoyaltyOverview } from "@/components/dashboard/loyalty/loyalty-overview";
import { LoyaltyTierGrid } from "@/components/dashboard/loyalty/loyalty-tiers";
import { PageContainer, PageHeader } from "@/components/dashboard/ui";
import type { MemberLoyaltyData } from "@/features/loyalty/types";

export function LoyaltyView({ data }: { data: MemberLoyaltyData }) {
  const t = useTranslations("SimplePages.loyalty");

  return (
    <PageContainer>
      <PageHeader title={t("title")} description={t("description")} />

      <div className="grid w-full gap-5 text-foreground">
        <LoyaltyOverview data={data} />
        <LoyaltyTierGrid
          tiers={data.tiers}
          windowDays={data.calculation.windowDays}
        />
        <LoyaltyHistory
          history={data.history}
          windowDays={data.calculation.windowDays}
        />
      </div>
    </PageContainer>
  );
}
