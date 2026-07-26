import { Check, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import {
  loyaltyCardClass,
  LoyaltyTierIcon,
  StatusBadge,
} from "@/components/dashboard/loyalty/loyalty-ui";
import { SoftCard } from "@/components/dashboard/ui";
import type { LoyaltyTier, TierStatus } from "@/features/loyalty/types";
import { cn } from "@/lib/utils";

export function LoyaltyTierGrid({
  tiers,
  windowDays,
}: {
  tiers: LoyaltyTier[];
  windowDays: number;
}) {
  const t = useTranslations("SimplePages.loyalty");

  return (
    <section aria-labelledby="loyalty-tiers-title">
      <div className="mb-4">
        <h2 id="loyalty-tiers-title" className="type-section-title">
          {t("tiersTitle")}
        </h2>
        <p className="type-body mt-2 max-w-3xl text-foreground/80">
          {t("tiersDescription")}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiers.map((tier) => (
          <TierCard key={tier.id} tier={tier} windowDays={windowDays} />
        ))}
      </div>
    </section>
  );
}

function TierCard({
  tier,
  windowDays,
}: {
  tier: LoyaltyTier;
  windowDays: number;
}) {
  const t = useTranslations("SimplePages.loyalty");
  const locale = useLocale();
  const status: TierStatus = tier.isCurrent
    ? "current"
    : tier.isNext
      ? "next"
      : "locked";

  return (
    <SoftCard
      className={cn(
        loyaltyCardClass,
        "flex min-h-[31rem] flex-col p-5",
        tier.isCurrent && "border-primary ring-1 ring-primary/20",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "grid size-9 place-items-center rounded-lg border",
            tier.isCurrent
              ? "border-primary/25 bg-primary/10 text-primary"
              : "border-border bg-muted/30 text-muted-foreground",
          )}
        >
          <LoyaltyTierIcon iconKey={tier.iconKey} className="size-4" />
        </span>
        {status !== "locked" ? <StatusBadge status={status} /> : null}
      </div>

      <h3 className="type-card-title mt-5 text-foreground">{tier.name}</h3>
      {tier.description ? (
        <p className="type-body-sm mt-2 text-foreground/75">
          {tier.description}
        </p>
      ) : null}

      <ul className="type-body-sm mt-4 space-y-2.5">
        {tier.benefits.map((benefit) => (
          <li key={benefit.key} className="flex items-start gap-2.5">
            {benefit.included ? (
              <Check
                className={cn(
                  "mt-0.5 size-4 shrink-0",
                  tier.isCurrent
                    ? "text-primary"
                    : "text-emerald-600 dark:text-emerald-400",
                )}
                aria-hidden="true"
              />
            ) : (
              <X
                className="mt-0.5 size-4 shrink-0 text-muted-foreground/70"
                aria-hidden="true"
              />
            )}
            <span
              className={cn(
                benefit.included
                  ? "text-foreground/90"
                  : "text-muted-foreground",
              )}
            >
              <span className="sr-only">
                {benefit.included ? t("included") : t("notIncluded")}: {" "}
              </span>
              {benefit.label}
              {benefit.value ? ` · ${benefit.value}` : ""}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-auto rounded-lg bg-muted/40 px-3 py-3">
        <p className="type-caption text-muted-foreground">
          {t("requirement")}
        </p>
        <p className="type-label mt-1 font-medium text-foreground">
          {t("requirementValue", {
            count: new Intl.NumberFormat(locale).format(
              tier.minimumValidViews,
            ),
            days: windowDays,
          })}
        </p>
      </div>
    </SoftCard>
  );
}
