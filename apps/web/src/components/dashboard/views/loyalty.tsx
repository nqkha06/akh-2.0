import { useTranslations } from "next-intl";

import { LoyaltyHistory } from "@/components/dashboard/loyalty/loyalty-history";
import { LoyaltyOverview } from "@/components/dashboard/loyalty/loyalty-overview";
import { LoyaltyTierGrid } from "@/components/dashboard/loyalty/loyalty-tiers";
import { PageHeader } from "@/components/dashboard/ui";

export function LoyaltyView() {
  const t = useTranslations("SimplePages.loyalty");

  return (
    <div className="mx-auto w-full max-w-[1280px]">
      <PageHeader title={t("title")} />

      <div className="mt-5 grid w-full gap-4 text-slate-900 sm:gap-5 dark:text-[#f7f8f8]">
        <LoyaltyOverview />
        <LoyaltyTierGrid />
        <LoyaltyHistory />
      </div>
    </div>
  );
}
