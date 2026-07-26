import { CircleCheck } from "lucide-react";

import {
  currentTierIndex,
  getTierStatus,
  tiers,
  type LoyaltyTier,
} from "@/components/dashboard/loyalty/loyalty-data";
import {
  loyaltyCardClass,
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
          "border-primary ring-1 ring-primary/20",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "grid size-9 place-items-center rounded-lg border",
            isCurrent
              ? "border-primary/25 bg-primary/10 text-primary"
              : "border-border bg-muted/30 text-muted-foreground",
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>
        {status !== "locked" ? <StatusBadge status={status} /> : null}
      </div>

      <h3 className="mt-5 text-xl font-medium tracking-[-0.025em] text-foreground">
        {tier.name}
      </h3>

      <ul className="mt-4 space-y-2.5 text-sm text-foreground/90">
        {tier.benefits.map((benefit) => (
          <li key={benefit} className="flex items-start gap-2">
            <CircleCheck
              className={cn(
                "mt-0.5 size-4 shrink-0",
                isCurrent
                  ? "text-primary"
                  : "text-emerald-600 dark:text-emerald-400",
              )}
              aria-hidden="true"
            />
            <span>{benefit}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto rounded-lg bg-muted/40 px-3 py-3">
        <p className="text-xs text-muted-foreground">Yêu cầu</p>
        <p className="mt-1 text-sm font-medium text-foreground">
          {tier.requirement} / 7 ngày
        </p>
      </div>
    </SoftCard>
  );
}
