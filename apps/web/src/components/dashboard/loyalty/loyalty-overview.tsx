import { Clock3 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import {
  loyaltyCardClass,
  LoyaltyTierIcon,
  sectionLabelClass,
  StatusBadge,
} from "@/components/dashboard/loyalty/loyalty-ui";
import { SoftCard } from "@/components/dashboard/ui";
import type { MemberLoyaltyData } from "@/features/loyalty/types";

export function LoyaltyOverview({ data }: { data: MemberLoyaltyData }) {
  const t = useTranslations("SimplePages.loyalty");
  const locale = useLocale();
  const number = new Intl.NumberFormat(locale);
  const { summary } = data;
  const currentTier = data.tiers.find((tier) => tier.isCurrent) ?? null;

  return (
    <SoftCard className={`${loyaltyCardClass} p-5 sm:p-6`}>
      <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_18rem] sm:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className={sectionLabelClass}>{t("currentTier")}</p>
            {currentTier ? <StatusBadge status="current" /> : null}
          </div>

          <div className="mt-3 flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
              <LoyaltyTierIcon
                iconKey={currentTier?.iconKey ?? null}
                className="size-5"
              />
            </span>
            <div>
              <h2 className="type-section-title text-foreground">
                {summary.currentTier?.name ?? t("unranked")}
              </h2>
              <p className="type-body-sm mt-1 text-muted-foreground">
                {t("qualification", {
                  days: data.calculation.windowDays,
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-primary/15 bg-primary/[0.06] px-5 py-4 text-center">
          <p className="type-caption font-medium uppercase tracking-[0.08em] text-primary">
            {summary.nextTier ? t("nextMilestone") : t("highestTier")}
          </p>
          <p className="type-card-title mt-2 text-foreground">
            {summary.nextTier
              ? t("tierName", { name: summary.nextTier.name })
              : summary.currentTier?.name ?? t("unranked")}
          </p>
          <p className="type-body-sm mt-1 text-muted-foreground">
            {summary.nextTierTarget !== null
              ? t("requiresViews", {
                  count: number.format(summary.nextTierTarget),
                })
              : t("highestTierDescription")}
          </p>
        </div>
      </div>

      <div className="mt-6 border-t border-border pt-5">
        <div className="type-label flex flex-wrap items-center justify-between gap-2">
          <p className="font-medium text-foreground">
            {summary.nextTier
              ? t("progressTo", { name: summary.nextTier.name })
              : t("tierProgress")}
          </p>
          <p className="font-medium text-primary">
            {number.format(summary.currentValue)}
            {summary.nextTierTarget !== null
              ? ` / ${number.format(summary.nextTierTarget)}`
              : ""}{" "}
            · {summary.progress}%
          </p>
        </div>

        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-label={t("progressLabel")}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={summary.progress}
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500"
            style={{ width: `${summary.progress}%` }}
          />
        </div>

        {summary.nextTier ? (
          <p className="type-caption mt-2 text-right text-muted-foreground">
            {t("remainingViews", { count: number.format(summary.remaining) })}
          </p>
        ) : null}
      </div>

      <div className="mt-5 flex gap-3 rounded-lg border-l-2 border-primary bg-primary/[0.06] px-4 py-3">
        <Clock3
          className="mt-0.5 size-4 shrink-0 text-primary"
          aria-hidden="true"
        />
        <div className="type-body-sm">
          <p className="font-medium text-foreground">
            {t("aggregationTitle")}
          </p>
          <p className="text-muted-foreground">
            {data.calculation.lastAggregatedAt
              ? t("aggregationDescription")
              : t("aggregationEmpty")}
          </p>
        </div>
      </div>
    </SoftCard>
  );
}
