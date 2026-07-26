"use client";

import {
  BadgeDollarSign,
  CheckCircle2,
  CircleDollarSign,
  Copy,
  Link as LinkIcon,
  Share2,
  UserCheck,
  UsersRound,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { PageContainer, PageHeader } from "@/components/dashboard/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ReferralsDashboard } from "@/features/referrals/types";
import { useMemberCurrency } from "@/features/currencies/components/member-currency-provider";
import { useSiteBrand } from "@/features/site-settings/components/site-brand-provider";
import { cn } from "@/lib/utils";

export function ReferralsView({ data }: { data: ReferralsDashboard }) {
  const t = useTranslations("SimplePages.referrals");
  const brand = useSiteBrand();
  const locale = useLocale();
  const { formatCurrency } = useMemberCurrency();
  const money = (value: string) =>
    formatCurrency(value, { sourceCurrency: data.currency });
  const date = (value: string | null) =>
    value
      ? new Intl.DateTimeFormat(locale, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(value))
      : "—";

  const copy = async (value: string, message: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(message);
    } catch {
      toast.error(t("copyFailed"));
    }
  };

  const shareTargets = [
    [
      "X",
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(data.referralUrl)}`,
    ],
    [
      "Facebook",
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(data.referralUrl)}`,
    ],
    [
      "WhatsApp",
      `https://wa.me/?text=${encodeURIComponent(data.referralUrl)}`,
    ],
    [
      "Telegram",
      `https://t.me/share/url?url=${encodeURIComponent(data.referralUrl)}`,
    ],
  ];

  return (
    <PageContainer>
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description", { brand: brand.siteName })}
        action={
          <Badge className="h-9 gap-1.5 bg-emerald-600 px-3 text-sm hover:bg-emerald-600">
            <BadgeDollarSign className="size-4" />
            {t("commissionRateValue", {
              rate: Number(data.commissionRate),
            })}
          </Badge>
        }
      />

      <Card className="gap-0 border-emerald-200 bg-emerald-50/70 px-4 py-3 shadow-none dark:border-emerald-900 dark:bg-emerald-950/20 sm:px-5">
        <p className="flex items-start gap-2 text-sm leading-6 text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          {t("paidOnlyContext")}
        </p>
      </Card>

      <section
        className="grid overflow-hidden rounded-xl border bg-card sm:grid-cols-3"
        aria-label={t("summary")}
      >
        <ReferralMetric
          icon={<UsersRound />}
          label={t("totalReferrals")}
          value={data.summary.totalReferrals.toLocaleString(locale)}
          primary
        />
        <ReferralMetric
          icon={<BadgeDollarSign />}
          label={t("commissionLabel")}
          value={`${Number(data.commissionRate).toLocaleString(locale)}%`}
        />
        <ReferralMetric
          icon={<CircleDollarSign />}
          label={t("totalCommission")}
          value={money(data.summary.totalCommission)}
        />
      </section>

      <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="min-w-0 gap-4 py-5 sm:py-6">
          <CardHeader className="px-5 sm:px-6">
            <CardTitle>{t("shareTitle")}</CardTitle>
            <CardDescription className="leading-6">
              {t("shareDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-5 sm:px-6">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-md border bg-muted/30 px-3">
                <LinkIcon className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate font-mono text-xs font-medium sm:text-sm">
                  {data.referralUrl}
                </span>
              </div>
              <Button
                type="button"
                className="h-11"
                onClick={() => void copy(data.referralUrl, t("copiedLink"))}
              >
                <Copy />
                {t("copy")}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {shareTargets.map(([label, href]) => (
                <Button
                  key={label}
                  asChild
                  type="button"
                  size="sm"
                  variant="outline"
                >
                  <a href={href} target="_blank" rel="noreferrer">
                    <Share2 />
                    {label}
                  </a>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0 gap-4 py-5 sm:py-6">
          <CardHeader className="px-5 sm:px-6">
            <CardTitle>{t("howTitle")}</CardTitle>
            <CardDescription>{t("howDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-5 sm:px-6">
            {[
              [LinkIcon, t("steps.copyTitle"), t("steps.copyDescription")],
              [UserCheck, t("steps.signupTitle"), t("steps.signupDescription")],
              [
                CircleDollarSign,
                t("steps.earnTitle"),
                t("steps.earnDescription"),
              ],
            ].map(([Icon, title, description], index) => {
              const StepIcon = Icon as typeof LinkIcon;
              return (
                <div key={title as string} className="flex gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {index + 1}
                  </span>
                  <div>
                    <p className="flex items-center gap-1.5 text-sm font-semibold">
                      <StepIcon className="size-4 text-muted-foreground" />
                      {title as string}
                    </p>
                    <p className="mt-1 text-sm leading-5 text-muted-foreground">
                      {description as string}
                    </p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card className="gap-0 overflow-hidden py-0">
        <CardHeader className="flex flex-col gap-2 border-b px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <CardTitle>{t("tableTitle")}</CardTitle>
            <CardDescription className="mt-1">
              {t("tableDescription")}
            </CardDescription>
          </div>
          <Badge variant="secondary">
            {t("referralCount", { count: data.summary.totalReferrals })}
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <caption className="sr-only">{t("tableTitle")}</caption>
              <thead className="border-b bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 sm:px-6">{t("table.details")}</th>
                  <th className="px-5 py-3">{t("table.status")}</th>
                  <th className="px-5 py-3">{t("table.date")}</th>
                  <th className="px-5 py-3 text-right">
                    {t("table.lastEarning")}
                  </th>
                  <th className="px-5 py-3 text-right sm:px-6">
                    {t("table.totalEarnings")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.referrals.length ? (
                  data.referrals.map((referral) => (
                    <tr key={referral.id} className="hover:bg-muted/20">
                      <td className="px-5 py-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <Avatar className="rounded-lg border">
                            <AvatarImage
                              src={referral.avatar || undefined}
                              alt={referral.name}
                            />
                            <AvatarFallback className="rounded-lg text-xs">
                              {initials(referral.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate font-medium">
                              {referral.name}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {referral.maskedEmail}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Badge
                          variant={
                            referral.successfulWithdrawals > 0
                              ? "default"
                              : "outline"
                          }
                          className={cn(
                            referral.successfulWithdrawals > 0 &&
                              "bg-emerald-600 hover:bg-emerald-600",
                          )}
                        >
                          {referral.successfulWithdrawals > 0
                            ? t("earningStatus")
                            : t("waitingStatus")}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {date(referral.joinedAt)}
                      </td>
                      <td className="px-5 py-4 text-right text-muted-foreground">
                        {date(referral.lastCommissionAt)}
                      </td>
                      <td className="px-5 py-4 text-right sm:px-6">
                        <p className="font-semibold tabular-nums">
                          {money(referral.totalCommission)}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {t("withdrawalsCount", {
                            count: referral.successfulWithdrawals,
                          })}
                        </p>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-14 text-center sm:px-6"
                    >
                      <div className="mx-auto max-w-md">
                        <span className="mx-auto grid size-12 place-items-center rounded-xl bg-primary/10 text-primary">
                          <UsersRound className="size-6" />
                        </span>
                        <p className="mt-4 font-semibold">{t("emptyTitle")}</p>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          {t("emptyDescription")}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="gap-0 overflow-hidden py-0">
        <CardHeader className="border-b px-5 py-5 sm:px-6">
          <CardTitle>{t("recentTitle")}</CardTitle>
          <CardDescription>{t("recentDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="divide-y p-0">
          {data.recentCommissions.length ? (
            data.recentCommissions.map((commission) => (
              <div
                key={commission.id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar size="sm">
                    <AvatarImage
                      src={commission.fromUser.avatar || undefined}
                      alt={commission.fromUser.name}
                    />
                    <AvatarFallback>
                      {initials(commission.fromUser.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {commission.fromUser.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("withdrawalReference", {
                        id: commission.withdrawalId,
                      })}{" "}
                      · {date(commission.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="font-semibold tabular-nums text-emerald-600">
                    +{money(commission.amount)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("rateApplied", {
                      rate: Number(commission.rate),
                    })}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground sm:px-6">
              {t("recentEmpty")}
            </p>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}

function ReferralMetric({
  icon,
  label,
  value,
  primary = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  primary?: boolean;
}) {
  return (
    <div
      className={cn(
        "border-b bg-card p-5 last:border-b-0 sm:border-r sm:border-b-0 sm:last:border-r-0",
      )}
    >
      <p
        className={cn(
          "flex items-center gap-2 text-sm font-medium [&_svg]:size-4",
          primary ? "text-primary" : "text-muted-foreground",
        )}
      >
        {icon}
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground tabular-nums">
        {value}
      </p>
    </div>
  );
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U"
  );
}
