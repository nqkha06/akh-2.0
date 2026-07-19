"use client";

import {
  BellRing,
  Check,
  CircleDollarSign,
  Globe2,
  Image,
  Layers3,
  LoaderCircle,
  Megaphone,
  MonitorSmartphone,
  Route,
  Star,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  MemberMonetizationAdDensity,
  MemberMonetizationLevel,
  MemberMonetizationLevelsResponse,
} from "@/features/member-monetization-levels/types";
import { selectMemberMonetizationLevel } from "@/features/member-monetization-levels/api/levels.client";
import { cn } from "@/lib/utils";

export function LevelsView({
  items,
  total,
  effectiveLevelId,
  usesSystemDefault,
  totalLinks,
}: MemberMonetizationLevelsResponse) {
  const t = useTranslations("SimplePages.levels");
  const locale = useLocale();
  const router = useRouter();
  const [currentLevelId, setCurrentLevelId] = React.useState(effectiveLevelId);
  const [selectingId, setSelectingId] = React.useState<number | null>(null);
  const currentLevel = items.find((level) => level.id === currentLevelId);
  const totalRates = items.reduce((sum, level) => sum + level.rates.length, 0);
  const markets = new Set(
    items.flatMap((level) => level.rates.map((rate) => rate.countryCode)),
  ).size;

  async function selectLevel(level: MemberMonetizationLevel) {
    if (level.id === currentLevelId || selectingId !== null) return;
    setSelectingId(level.id);
    try {
      const result = await selectMemberMonetizationLevel(level.id);
      setCurrentLevelId(result.monetizationLevelId);
      toast.success(
        t("selectionSuccess", {
          level: localizedLevel(level, locale).name,
        }),
      );
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("selectionFailed"),
      );
    } finally {
      setSelectingId(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-primary">
          {t("eyebrow")}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">
          {t("title")}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          {t("description")}
        </p>
      </header>

      <section
        aria-label={t("overview")}
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <SummaryCard
          icon={Layers3}
          label={t("activeLevels")}
          value={total.toLocaleString(locale)}
          description={t("activeLevelsDescription")}
        />
        <SummaryCard
          icon={Star}
          label={t("currentLevel")}
          value={
            currentLevel
              ? localizedLevel(currentLevel, locale).name
              : t("notConfigured")
          }
          description={
            usesSystemDefault ? t("usingSystemDefault") : t("userSelectedLevel")
          }
        />
        <SummaryCard
          icon={Globe2}
          label={t("configuredMarkets")}
          value={markets.toLocaleString(locale)}
          description={t("ratesCount", { count: totalRates })}
        />
        <SummaryCard
          icon={Layers3}
          label={t("linksUsingLevels")}
          value={totalLinks.toLocaleString(locale)}
          description={t("linksUsingLevelsDescription")}
        />
      </section>

      {items.length ? (
        <>
          <section aria-labelledby="level-catalog-title">
            <div className="mb-4">
              <h2
                id="level-catalog-title"
                className="text-lg font-semibold tracking-[-0.02em]"
              >
                {t("catalogTitle")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("catalogDescription")}
              </p>
            </div>
            <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
              {items.map((level, index) => (
                <LevelCard
                  key={level.id}
                  level={level}
                  index={index}
                  locale={locale}
                  selected={level.id === currentLevelId}
                  selecting={level.id === selectingId}
                  selectionDisabled={selectingId !== null}
                  onSelect={() => void selectLevel(level)}
                />
              ))}
            </div>
          </section>

          <RatesTable levels={items} locale={locale} />
        </>
      ) : (
        <Card className="border-dashed shadow-none">
          <CardContent className="grid min-h-64 place-items-center p-8 text-center">
            <div className="max-w-md">
              <div className="mx-auto grid size-11 place-items-center rounded-lg bg-muted text-muted-foreground">
                <CircleDollarSign className="size-5" />
              </div>
              <h2 className="mt-4 font-semibold">{t("emptyTitle")}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t("emptyDescription")}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function LevelCard({
  level,
  index,
  locale,
  selected,
  selecting,
  selectionDisabled,
  onSelect,
}: {
  level: MemberMonetizationLevel;
  index: number;
  locale: string;
  selected: boolean;
  selecting: boolean;
  selectionDisabled: boolean;
  onSelect: () => void;
}) {
  const t = useTranslations("SimplePages.levels");
  const content = localizedLevel(level, locale);
  const experience = level.metaData.visitorExperience;

  return (
    <Card
      className={cn(
        "gap-0 overflow-hidden py-0 shadow-none",
        selected && "border-primary/50 ring-1 ring-primary/15",
      )}
    >
      <CardHeader className="border-b bg-muted/15 px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              {t("levelNumber", {
                number: String(index + 1).padStart(2, "0"),
              })}
            </p>
            <h3 className="mt-1 truncate text-lg font-semibold tracking-[-0.02em]">
              {content.name}
            </h3>
          </div>
          <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
            {level.isDefault ? (
              <Badge variant="secondary">
                <Star className="fill-current" />
                {t("defaultBadge")}
              </Badge>
            ) : null}
            {selected ? (
              <Badge className="bg-primary hover:bg-primary">
                <Check />
                {t("selectedBadge")}
              </Badge>
            ) : null}
          </div>
        </div>
        <p className="mt-2 min-h-10 text-sm leading-5 text-muted-foreground">
          {content.description || t("noDescription")}
        </p>
      </CardHeader>

      <CardContent className="p-5">
        <dl className="grid grid-cols-3 divide-x rounded-lg border">
          <Metric
            label={t("profit")}
            value={formatPercent(level.metaData.profitBps, locale)}
          />
          <Metric
            label={t("steps")}
            value={level.metaData.stepCount.toLocaleString(locale)}
          />
          <Metric
            label={t("rateRules")}
            value={level.rates.length.toLocaleString(locale)}
          />
        </dl>

        <div className="mt-5">
          <p className="text-xs font-medium text-muted-foreground">
            {t("visitorExperience")}
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <ExperienceItem
              icon={Megaphone}
              label={t("popup")}
              value={experience.popup}
            />
            <ExperienceItem
              icon={Image}
              label={t("banner")}
              value={experience.banner}
            />
            <ExperienceItem
              icon={MonitorSmartphone}
              label={t("interstitial")}
              value={experience.interstitial}
            />
            <ExperienceItem
              icon={BellRing}
              label={t("notification")}
              value={experience.notification}
            />
          </div>
        </div>

        <div className="mt-5 border-t pt-4">
          <Button
            type="button"
            variant={selected ? "secondary" : "default"}
            className="w-full"
            disabled={selected || selectionDisabled}
            onClick={onSelect}
          >
            {selecting ? (
              <LoaderCircle className="animate-spin motion-reduce:animate-none" />
            ) : selected ? (
              <Check />
            ) : null}
            {selecting
              ? t("selecting")
              : selected
                ? t("currentlySelected")
                : t("selectLevel")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function RatesTable({
  levels,
  locale,
}: {
  levels: MemberMonetizationLevel[];
  locale: string;
}) {
  const t = useTranslations("SimplePages.levels");
  const rows = levels.flatMap((level) => {
    const content = localizedLevel(level, locale);
    return level.rates.map((rate) => ({
      ...rate,
      levelId: level.id,
      levelName: content.name,
    }));
  });

  return (
    <section aria-labelledby="rates-table-title">
      <div className="mb-4">
        <h2
          id="rates-table-title"
          className="text-lg font-semibold tracking-[-0.02em]"
        >
          {t("ratesTitle")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("ratesDescription")}
        </p>
      </div>
      <Card className="overflow-hidden py-0 shadow-none">
        {rows.length ? (
          <div className="w-full min-w-0 overflow-x-auto">
            <Table className="min-w-[720px]">
              <TableHeader>
                <TableRow>
                  <TableHead>{t("level")}</TableHead>
                  <TableHead>{t("market")}</TableHead>
                  <TableHead>{t("device")}</TableHead>
                  <TableHead>{t("baseCpm")}</TableHead>
                  <TableHead>{t("dailyLimit")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((rate) => (
                  <TableRow
                    key={`${rate.levelId}:${rate.countryCode}:${rate.deviceType}`}
                  >
                    <TableCell className="font-medium">
                      {rate.levelName}
                    </TableCell>
                    <TableCell>{marketLabel(rate.countryCode, t)}</TableCell>
                    <TableCell>{t(`devices.${rate.deviceType}`)}</TableCell>
                    <TableCell className="font-medium tabular-nums">
                      {formatMoney(rate.baseCpm, rate.currency, locale)}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {rate.dailyLimit === null
                        ? t("unlimited")
                        : rate.dailyLimit.toLocaleString(locale)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <CardContent className="flex min-h-32 items-center justify-center gap-2 text-sm text-muted-foreground">
            <Route className="size-4" />
            {t("noRates")}
          </CardContent>
        )}
      </Card>
    </section>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <Icon className="size-4 text-muted-foreground" />
        </div>
        <p className="mt-2 truncate text-xl font-semibold tracking-[-0.03em]">
          {value}
        </p>
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 px-3 py-3 text-center">
      <dt className="truncate text-[11px] text-muted-foreground">{label}</dt>
      <dd className="mt-1 truncate font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

function ExperienceItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: MemberMonetizationAdDensity;
}) {
  const t = useTranslations("SimplePages.levels");
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-md border bg-muted/10 px-3 py-2">
      <Icon className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate text-xs">{label}</span>
      <span className="truncate text-xs font-medium">
        {t(`density.${value}`)}
      </span>
    </div>
  );
}

function localizedLevel(level: MemberMonetizationLevel, locale: string) {
  const normalized = locale.toLowerCase();
  const translation =
    level.translations.find(
      (item) => item.locale.toLowerCase() === normalized,
    ) ??
    level.translations.find(
      (item) => item.locale.toLowerCase() === normalized.split("-")[0],
    ) ??
    level.translations.find((item) => item.locale === "vi") ??
    level.translations.find((item) => item.locale === "en") ??
    level.translations[0];

  return {
    name: translation?.name ?? level.key,
    description: translation?.description ?? null,
  };
}

function formatPercent(profitBps: number, locale: string) {
  return `${new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
  }).format(profitBps / 100)}%`;
}

function formatMoney(value: string, currency: string, locale: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return `${value} ${currency}`;
  return `${new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  }).format(amount)} ${currency}`;
}

function marketLabel(
  countryCode: string,
  t: ReturnType<typeof useTranslations<"SimplePages.levels">>,
) {
  if (countryCode === "ALL") return t("allMarkets");
  if (countryCode === "ZZ") return t("unknownMarket");
  return countryCode;
}
