import { Gem, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import { useTranslations } from "next-intl";

import type { TierStatus } from "@/features/loyalty/types";
import { cn } from "@/lib/utils";

export const loyaltyCardClass = [
  "gap-0 rounded-xl border border-border bg-card py-0 shadow-none",
  "transition-[background-color,border-color] duration-200",
  "hover:border-foreground/20 hover:shadow-none",
].join(" ");

export const sectionLabelClass =
  "text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground";

export function StatusBadge({
  status,
}: {
  status: Exclude<TierStatus, "locked">;
}) {
  const t = useTranslations("SimplePages.loyalty");
  const label = status === "current" ? t("currentBadge") : t("nextBadge");

  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium",
        status === "current"
          ? "border-primary/25 bg-primary/10 text-primary"
          : "border-border bg-muted/30 text-muted-foreground",
      )}
    >
      {label}
    </span>
  );
}

export function LoyaltyTierIcon({
  iconKey,
  className,
}: {
  iconKey: string | null;
  className?: string;
}) {
  if (iconKey === "gem") {
    return <Gem className={className} aria-hidden="true" />;
  }
  if (iconKey === "shield-check") {
    return <ShieldCheck className={className} aria-hidden="true" />;
  }
  if (iconKey === "trophy") {
    return <Trophy className={className} aria-hidden="true" />;
  }
  return <Sparkles className={className} aria-hidden="true" />;
}
