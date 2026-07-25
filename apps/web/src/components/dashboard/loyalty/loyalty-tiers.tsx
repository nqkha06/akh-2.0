import { CircleCheck } from "lucide-react";

import {
  currentTierIndex,
  getTierStatus,
  tiers,
  type LoyaltyTier,
} from "@/components/dashboard/loyalty/loyalty-data";
import {
  loyaltyCardClass,
  sectionLabelClass,
  StatusBadge,
} from "@/components/dashboard/loyalty/loyalty-ui";
import { SoftCard } from "@/components/dashboard/ui";
import { cn } from "@/lib/utils";

export function LoyaltyTierGrid() {
  return (
    <section aria-labelledby="loyalty-tiers-title">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiers.map((tier, index) => (
          <TierCard key={tier.id} tier={tier} index={index} />
        ))}
      </div>
    </section>
  );
}

function TierCard({ tier, index }: { tier: LoyaltyTier; index: number }) {
  const status = getTierStatus(index);
  const isCurrent = index === currentTierIndex;
  const Icon = tier.icon;

  return (
    <SoftCard
      className={cn(
        loyaltyCardClass,
        "flex min-h-64 flex-col p-5",
        isCurrent &&
          "border-[#5e6ad2] ring-1 ring-[#5e6ad2]/20 dark:border-[#5e6ad2]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "grid size-9 place-items-center rounded-lg border",
            isCurrent
              ? "border-[#5e6ad2]/25 bg-[#5e6ad2]/10 text-[#5e6ad2] dark:border-[#5e6ad2]/35 dark:bg-[#5e6ad2]/15 dark:text-[#aab2ff]"
              : "border-slate-200 bg-slate-50 text-slate-500 dark:border-[#34343a] dark:bg-[#18191a] dark:text-[#8a8f98]",
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>
        {status !== "locked" ? <StatusBadge status={status} /> : null}
      </div>

      <h3 className="mt-5 text-xl font-medium tracking-[-0.025em] text-slate-950 dark:text-[#f7f8f8]">
        {tier.name}
      </h3>

      <ul className="mt-4 space-y-2.5 text-sm text-slate-700 dark:text-[#d0d6e0]">
        {tier.benefits.map((benefit) => (
          <li key={benefit} className="flex items-start gap-2">
            <CircleCheck
              className={cn(
                "mt-0.5 size-4 shrink-0",
                isCurrent
                  ? "text-[#5e6ad2] dark:text-[#aab2ff]"
                  : "text-[#27a644]",
              )}
              aria-hidden="true"
            />
            <span>{benefit}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto rounded-lg bg-slate-50 px-3 py-3 dark:bg-[#141516]">
        <p className="text-xs text-slate-500 dark:text-[#8a8f98]">Yêu cầu</p>
        <p className="mt-1 text-sm font-medium text-slate-800 dark:text-[#d0d6e0]">
          {tier.requirement} / 7 ngày
        </p>
      </div>
    </SoftCard>
  );
}
