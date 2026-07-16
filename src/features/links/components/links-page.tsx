"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import {
  Activity,
  Check,
  CircleCheck,
  CircleDollarSign,
  CircleSlash,
  Filter,
  Home,
  Link2,
  Megaphone,
  MonitorSmartphone,
  MousePointerClick,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { PageHeader } from "@/components/dashboard/ui";
import { TablePagination } from "@/components/table-pagination";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SocialLinksGenerator from "@/features/link-creation/components/link-creator";
import { getLinks, type LinkDto } from "@/lib/api-client";
import { LinkCard } from "./link-card";
import { filterLinks, sortLinks } from "../lib/filter-links";
import {
  defaultLinkFilters,
  type LinkFilters,
  type LinkSort,
  type LinkStatusFilter,
  type LinkTypeFilter,
  type LinksTab,
} from "../types";

const linksTabs: Array<{ id: LinksTab; labelKey: string; icon: LucideIcon }> = [
  { id: "overview", labelKey: "tabs.overview", icon: Home },
  { id: "create", labelKey: "tabs.create", icon: Plus },
  { id: "monetization", labelKey: "tabs.monetization", icon: CircleDollarSign },
];

function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onStoreChange) => {
      const mediaQuery = window.matchMedia(query);
      mediaQuery.addEventListener("change", onStoreChange);
      return () => mediaQuery.removeEventListener("change", onStoreChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export function LinksView() {
  const t = useTranslations("Links");
  const locale = useLocale();
  const [activeTab, setActiveTab] = useState<LinksTab>("overview");
  const [links, setLinks] = useState<LinkDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState<LinkFilters>(defaultLinkFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filterOpen, setFilterOpen] = useState(false);
  const isDesktopFilter = useMediaQuery("(min-width: 768px)");
  const filterDirection = isDesktopFilter ? "right" : "bottom";
  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);

  const loadLinks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getLinks();
      setLinks(data);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t("loadErrorFallback"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void Promise.resolve().then(loadLinks);
    const refreshLinks = () => void loadLinks();
    window.addEventListener("Rekonise:link-created", refreshLinks);
    return () => window.removeEventListener("Rekonise:link-created", refreshLinks);
  }, [loadLinks]);

  const platformOptions = useMemo(
    () => Array.from(new Set(links.flatMap((link) => link.actions.map((action) => action.platform)))).sort((a, b) => a.localeCompare(b)),
    [links],
  );
  const filteredLinks = useMemo(() => sortLinks(filterLinks(links, filters), filters.sort), [filters, links]);
  const totalPages = Math.max(1, Math.ceil(filteredLinks.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedLinks = filteredLinks.slice((safePage - 1) * pageSize, safePage * pageSize);
  const activeFilterCount = [
    filters.status !== "all",
    filters.inputType !== "all",
    filters.platform !== "all",
    Boolean(filters.createdFrom),
    Boolean(filters.createdTo),
    Boolean(filters.minClicks),
    filters.highPerformance,
  ].filter(Boolean).length;
  const metrics = useMemo(() => ({
    total: links.length,
    active: links.filter((link) => link.status === "active").length,
    clicks: links.reduce((sum, link) => sum + link.clicks, 0),
    actions: links.reduce((sum, link) => sum + link.actions.length, 0),
  }), [links]);

  const updateFilter = <Key extends keyof LinkFilters>(key: Key, value: LinkFilters[Key]) => {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const resetFilters = () => {
    setPage(1);
    setFilters(defaultLinkFilters);
  };

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-6">
      <PageHeader
        eyebrow={t("management")}
        title={t("socialLinks")}
        description={t("description")}
        action={
          <Button
            type="button"
            className="h-10 w-full rounded-lg px-4 shadow-none sm:w-auto"
            onClick={() => setActiveTab("create")}
          >
            <Plus />{t("createNew")}
          </Button>
        }
      />

      <LinksTabs activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "overview" ? <div className="space-y-6">
        <div className="rounded-xl border border-border bg-card px-4 py-3 sm:px-5">
          <p className="flex items-start gap-2 text-sm leading-6 text-muted-foreground">
            <Workflow className="mt-1 size-4 shrink-0 text-primary" />
            {t("context")}
          </p>
        </div>

        {error ? (
        <Alert variant="destructive" className="shadow-none">
          <AlertTitle>{t("loadErrorTitle")}</AlertTitle>
          <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{error}</span>
            <Button type="button" variant="outline" size="sm" className="bg-background" onClick={() => void loadLinks()}>{t("tryAgain")}</Button>
          </AlertDescription>
        </Alert>
      ) : loading ? (
        <LinksPageSkeleton />
      ) : (
        <>
          <section className="grid overflow-hidden rounded-xl border border-border bg-card sm:grid-cols-2 xl:grid-cols-4" aria-label={t("summary.label")}>
            <SummaryMetric icon={Link2} label={t("summary.total")} value={numberFormatter.format(metrics.total)} />
            <SummaryMetric icon={CircleCheck} label={t("summary.active")} value={numberFormatter.format(metrics.active)} accent />
            <SummaryMetric icon={MousePointerClick} label={t("summary.clicks")} value={numberFormatter.format(metrics.clicks)} />
            <SummaryMetric icon={Activity} label={t("summary.actions")} value={numberFormatter.format(metrics.actions)} />
          </section>

          <Card className="gap-3 border-border bg-card p-3 shadow-none">
            <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
              <div className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-lg border border-border bg-background px-3">
                <Search className="size-4 shrink-0 text-muted-foreground" />
                <Input
                  aria-label={t("searchPlaceholder")}
                  value={filters.query}
                  onChange={(event) => updateFilter("query", event.target.value)}
                  className="h-8 min-w-0 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                  placeholder={t("searchPlaceholder")}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:flex xl:shrink-0">
                <Select value={filters.status} onValueChange={(value) => updateFilter("status", value as LinkStatusFilter)}>
                  <SelectTrigger className="h-10 w-full rounded-lg bg-background shadow-none xl:w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("allStatus")}</SelectItem>
                    <SelectItem value="active">{t("statusActive")}</SelectItem>
                    <SelectItem value="inactive">{t("statusInactive")}</SelectItem>
                    <SelectItem value="paused">{t("statusPaused")}</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.inputType} onValueChange={(value) => updateFilter("inputType", value as LinkTypeFilter)}>
                  <SelectTrigger className="h-10 w-full rounded-lg bg-background shadow-none xl:w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("allTypes")}</SelectItem>
                    <SelectItem value="url">{t("typeUrl")}</SelectItem>
                    <SelectItem value="file">{t("typeFile")}</SelectItem>
                    <SelectItem value="snippet">{t("typeSnippet")}</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.sort} onValueChange={(value) => updateFilter("sort", value as LinkSort)}>
                  <SelectTrigger className="h-10 w-full rounded-lg bg-background shadow-none xl:w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">{t("sort.newest")}</SelectItem>
                    <SelectItem value="oldest">{t("sort.oldest")}</SelectItem>
                    <SelectItem value="clicks-desc">{t("sort.clicksDesc")}</SelectItem>
                    <SelectItem value="title-asc">{t("sort.titleAsc")}</SelectItem>
                    <SelectItem value="actions-desc">{t("sort.actionsDesc")}</SelectItem>
                  </SelectContent>
                </Select>

                <Drawer key={filterDirection} open={filterOpen} onOpenChange={setFilterOpen} direction={filterDirection}>
                  <DrawerTrigger asChild>
                    <Button type="button" variant="outline" className="relative h-10 rounded-lg bg-background px-3 shadow-none">
                      <Filter />{t("filter")}
                      {activeFilterCount > 0 ? <Badge className="min-w-5 justify-center px-1.5">{activeFilterCount}</Badge> : null}
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent className={isDesktopFilter ? "overflow-hidden border-border bg-background sm:max-w-md" : "max-h-[86dvh] overflow-hidden rounded-t-2xl border-border bg-background"}>
                    <DrawerHeader className="border-b border-border px-5 py-4 text-left">
                      <DrawerTitle className="flex items-center gap-2 text-base"><Filter className="size-4 text-primary" />{t("filter")}</DrawerTitle>
                      <p className="text-sm leading-6 text-muted-foreground">{t("filterDescription")}</p>
                    </DrawerHeader>
                    <div className={isDesktopFilter ? "flex h-[calc(100dvh-89px)] flex-col" : "flex max-h-[calc(86dvh-89px)] flex-col"}>
                      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                        <FilterSelect label={t("platform")} id="links-platform">
                          <Select value={filters.platform} onValueChange={(value) => updateFilter("platform", value)}>
                            <SelectTrigger id="links-platform" className="h-10 w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">{t("allPlatforms")}</SelectItem>
                              {platformOptions.map((platform) => <SelectItem key={platform} value={platform}>{platform}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </FilterSelect>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <FilterSelect label={t("fromDate")} id="links-created-from">
                            <Input id="links-created-from" type="date" value={filters.createdFrom} onChange={(event) => updateFilter("createdFrom", event.target.value)} className="h-10" />
                          </FilterSelect>
                          <FilterSelect label={t("toDate")} id="links-created-to">
                            <Input id="links-created-to" type="date" value={filters.createdTo} onChange={(event) => updateFilter("createdTo", event.target.value)} className="h-10" />
                          </FilterSelect>
                        </div>

                        <FilterSelect label={t("minClicks")} id="links-min-clicks">
                          <Input id="links-min-clicks" type="number" min={0} value={filters.minClicks} onChange={(event) => updateFilter("minClicks", event.target.value)} placeholder={t("minClicksPlaceholder")} className="h-10" />
                        </FilterSelect>

                        <Label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-muted/20 p-3">
                          <Checkbox checked={filters.highPerformance} onCheckedChange={(checked) => updateFilter("highPerformance", checked === true)} className="mt-0.5" />
                          <span>
                            <span className="block text-sm font-medium text-foreground">{t("highPerformance")}</span>
                            <span className="mt-1 block text-xs leading-5 font-normal text-muted-foreground">{t("highPerformanceDescription")}</span>
                          </span>
                        </Label>
                      </div>
                      <div className="flex gap-2 border-t border-border px-5 py-4">
                        <Button type="button" variant="outline" className="h-10 flex-1" onClick={resetFilters}><RotateCcw />{t("reset")}</Button>
                        <Button type="button" className="h-10 flex-1" onClick={() => setFilterOpen(false)}>{t("apply")}</Button>
                      </div>
                    </div>
                  </DrawerContent>
                </Drawer>
              </div>
            </div>

            {activeFilterCount > 0 || filters.query ? (
              <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
                <SlidersHorizontal className="size-3.5 text-primary" />
                <span>{t("filteredCount", { count: filteredLinks.length, total: links.length })}</span>
                <Button type="button" variant="ghost" size="xs" className="h-7 px-2" onClick={resetFilters}><RotateCcw />{t("reset")}</Button>
              </div>
            ) : null}
          </Card>

          {links.length === 0 ? (
            <LinksEmptyState icon={Link2} title={t("emptyTitle")} description={t("emptyDescription")}>
              <Button type="button" className="h-10" onClick={() => setActiveTab("create")}><Plus />{t("createNew")}</Button>
            </LinksEmptyState>
          ) : filteredLinks.length === 0 ? (
            <LinksEmptyState icon={Search} title={t("notFound")} description={t("notFoundDescription")}>
              <Button type="button" variant="outline" className="h-10" onClick={resetFilters}><RotateCcw />{t("resetFilters")}</Button>
            </LinksEmptyState>
          ) : (
            <section className="space-y-3" aria-label={t("listLabel")}>
              {paginatedLinks.map((link) => <LinkCard key={link.id} link={link} />)}
            </section>
          )}

          {filteredLinks.length > 0 ? (
            <footer className="border-t border-border pt-4">
              <TablePagination
                page={safePage}
                pageSize={pageSize}
                totalItems={filteredLinks.length}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            </footer>
          ) : null}
        </>
        )}
      </div> : null}

      {activeTab === "create" ? (
        <section aria-label={t("tabs.create")}>
          <SocialLinksGenerator embedded />
        </section>
      ) : null}

      {activeTab === "monetization" ? <MonetizationPanel /> : null}
    </div>
  );
}

function LinksTabs({ activeTab, onChange }: { activeTab: LinksTab; onChange: (tab: LinksTab) => void }) {
  const t = useTranslations("Links");

  return (
    <Tabs value={activeTab} onValueChange={(value) => onChange(value as LinksTab)}>
      <TabsList
        variant="line"
        className="h-11 w-full justify-start gap-0 rounded-none border-b border-border bg-transparent p-0"
        aria-label={t("tabs.label")}
      >
        {linksTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="h-11 flex-1 rounded-none border-0 px-3 text-sm font-medium text-muted-foreground shadow-none after:bg-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none sm:flex-none sm:px-5"
            >
              <Icon className="size-4" />
              {t(tab.labelKey)}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}

type MonetizationPlanId = "clean" | "faucet" | "low" | "balanced" | "high" | "maximum";
type AdDensity = "none" | "limited" | "maximum";

const monetizationPlans: Array<{
  id: MonetizationPlanId;
  profit: string;
  steps: number;
  ads: Record<"popup" | "banner" | "interstitial" | "notification", AdDensity>;
}> = [
  { id: "clean", profit: "1%", steps: 1, ads: { popup: "limited", banner: "none", interstitial: "none", notification: "none" } },
  { id: "faucet", profit: "20%", steps: 5, ads: { popup: "maximum", banner: "maximum", interstitial: "none", notification: "none" } },
  { id: "low", profit: "20%", steps: 2, ads: { popup: "limited", banner: "maximum", interstitial: "none", notification: "none" } },
  { id: "balanced", profit: "50%", steps: 3, ads: { popup: "limited", banner: "maximum", interstitial: "none", notification: "none" } },
  { id: "high", profit: "80%", steps: 4, ads: { popup: "limited", banner: "maximum", interstitial: "none", notification: "none" } },
  { id: "maximum", profit: "100%", steps: 5, ads: { popup: "limited", banner: "maximum", interstitial: "none", notification: "none" } },
];

const adTypes = ["popup", "banner", "interstitial", "notification"] as const;
const payoutRates = [
  { country: "unitedStates", code: "US", desktopBase: 12, mobileBase: 12 },
  { country: "canada", code: "CA", desktopBase: 11, mobileBase: 11 },
  { country: "unitedKingdom", code: "GB", desktopBase: 10, mobileBase: 10 },
  { country: "germany", code: "DE", desktopBase: 8, mobileBase: 8 },
  { country: "france", code: "FR", desktopBase: 8, mobileBase: 8 },
  { country: "vietnam", code: "VN", desktopBase: 1.8, mobileBase: 1.5 },
] as const;

function MonetizationPanel() {
  const t = useTranslations("Links");
  const [currentPlanId, setCurrentPlanId] = useState<MonetizationPlanId>("high");
  const [pendingPlanId, setPendingPlanId] = useState<MonetizationPlanId | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const currentPlan = monetizationPlans.find((plan) => plan.id === currentPlanId) ?? monetizationPlans[0];
  const pendingPlan = monetizationPlans.find((plan) => plan.id === pendingPlanId) ?? null;
  const profitShare = Number.parseInt(currentPlan.profit, 10) / 100;
  const formatCpm = (value: number) => `$${(value * profitShare).toFixed(2)}`;

  const closeEnrollment = () => {
    setPendingPlanId(null);
    setAgreedToTerms(false);
  };

  const enroll = () => {
    if (!pendingPlan || !agreedToTerms) return;
    setCurrentPlanId(pendingPlan.id);
    closeEnrollment();
  };

  return (
    <div className="space-y-5">
      <Card className="gap-0 rounded-xl border-border bg-card px-4 py-3 shadow-none sm:flex-row sm:items-center sm:px-5">
        <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
          <Check className="size-4 shrink-0 text-primary" />
          <span>{t("monetization.currentPlan")}</span>
          <strong className="truncate text-foreground">{t(`monetization.plans.${currentPlan.id}.title`)}</strong>
          <span className="hidden text-border sm:inline">·</span>
          <span className="hidden sm:inline">{t("monetization.contextProfit", { profit: currentPlan.profit })}</span>
          <span className="hidden text-border sm:inline">·</span>
          <span className="hidden sm:inline">{t("monetization.contextSteps", { steps: currentPlan.steps })}</span>
        </div>
        <p className="mt-2 text-xs leading-5 text-muted-foreground sm:mt-0 sm:ml-auto sm:max-w-md sm:text-right">
          {t("monetization.contextHint")}
        </p>
      </Card>

      <section aria-labelledby="monetization-plans" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <h2 id="monetization-plans" className="sr-only">{t("monetization.plansTitle")}</h2>
        {monetizationPlans.map((plan) => {
          const isCurrent = plan.id === currentPlanId;
          return (
            <Card
              key={plan.id}
              className={`gap-0 overflow-hidden rounded-xl border bg-card p-0 shadow-none transition-colors ${isCurrent ? "border-primary/50" : "border-border hover:border-foreground/20"}`}
            >
              <CardHeader className="px-5 pt-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg tracking-[-0.02em]">{t(`monetization.plans.${plan.id}.title`)}</CardTitle>
                    <CardDescription className="mt-1 leading-5">{t(`monetization.plans.${plan.id}.description`)}</CardDescription>
                  </div>
                  {isCurrent ? <Badge className="shrink-0">{t("monetization.active")}</Badge> : null}
                </div>
              </CardHeader>

              <CardContent className="space-y-5 px-5 py-5">
                <div className="grid grid-cols-2 divide-x divide-border rounded-lg border border-border bg-muted/20">
                  <div className="px-3 py-3">
                    <p className="text-xs text-muted-foreground">{t("monetization.profit")}</p>
                    <p className="mt-1 text-xl font-semibold tracking-[-0.02em] text-foreground">{plan.profit}</p>
                  </div>
                  <div className="px-3 py-3">
                    <p className="text-xs text-muted-foreground">{t("monetization.steps")}</p>
                    <p className="mt-1 text-xl font-semibold tracking-[-0.02em] text-foreground">{plan.steps}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-medium text-muted-foreground">{t("monetization.visitorExperience")}</p>
                  {adTypes.map((adType) => {
                    const density = plan.ads[adType];
                    const isDisabled = density === "none";
                    return (
                      <div key={adType} className="flex items-center gap-3">
                        <span className="grid size-7 shrink-0 place-items-center rounded-md border border-border bg-muted/20 text-muted-foreground">
                          {isDisabled ? <CircleSlash className="size-3.5" /> : <Megaphone className="size-3.5" />}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">{t(`monetization.ads.${adType}`)}</p>
                          <p className="text-xs text-muted-foreground">{t(`monetization.adDensity.${density}`)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>

              <CardFooter className="border-t border-border bg-muted/10 px-5 py-4">
                {isCurrent ? (
                  <Button className="w-full shadow-none" disabled><Check />{t("monetization.active")}</Button>
                ) : (
                  <Button type="button" variant="outline" className="w-full shadow-none" onClick={() => setPendingPlanId(plan.id)}>
                    <MonitorSmartphone />{t("monetization.enroll")}
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </section>

      <Card className="gap-0 overflow-hidden rounded-xl border-border bg-card shadow-none">
        <CardHeader className="flex flex-col gap-3 border-b border-border sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>{t("monetization.payoutTitle")}</CardTitle>
            <CardDescription className="mt-1 leading-5">{t("monetization.payoutDescription")}</CardDescription>
          </div>
          <Badge variant="secondary" className="w-fit">{t("monetization.contextProfit", { profit: currentPlan.profit })}</Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[580px] text-sm">
              <caption className="sr-only">{t("monetization.payoutTitle")}</caption>
              <thead className="border-b border-border bg-muted/20 text-xs font-medium text-muted-foreground">
                <tr>
                  <th scope="col" className="px-5 py-3 text-left sm:px-6">{t("monetization.country")}</th>
                  <th scope="col" className="px-5 py-3 text-right sm:px-6">{t("monetization.desktopCpm")}</th>
                  <th scope="col" className="px-5 py-3 text-right sm:px-6">{t("monetization.mobileCpm")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payoutRates.map((rate) => (
                  <tr key={rate.country} className="hover:bg-muted/15">
                    <td className="px-5 py-3 sm:px-6">
                      <div className="flex items-center gap-3">
                        <span className="grid size-7 place-items-center rounded-md border border-border bg-muted/20 text-[10px] font-semibold text-muted-foreground">{rate.code}</span>
                        <span className="font-medium text-foreground">{t(`monetization.countries.${rate.country}`)}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right font-medium tabular-nums text-foreground sm:px-6">{formatCpm(rate.desktopBase)}</td>
                    <td className="px-5 py-3 text-right font-medium tabular-nums text-foreground sm:px-6">{formatCpm(rate.mobileBase)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
        <CardFooter className="border-t border-border bg-muted/10 px-5 py-3 text-xs leading-5 text-muted-foreground sm:px-6">
          {t("monetization.payoutNote")}
        </CardFooter>
      </Card>

      <AlertDialog open={Boolean(pendingPlan)} onOpenChange={(open) => !open && closeEnrollment()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("monetization.confirmTitle", { plan: pendingPlan ? t(`monetization.plans.${pendingPlan.id}.title`) : "" })}</AlertDialogTitle>
            <AlertDialogDescription>{t("monetization.confirmDescription", { profit: pendingPlan?.profit ?? "", steps: pendingPlan?.steps ?? 0 })}</AlertDialogDescription>
          </AlertDialogHeader>
          <Label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-muted/20 p-3 text-sm font-normal leading-5 text-muted-foreground">
            <Checkbox checked={agreedToTerms} onCheckedChange={(checked) => setAgreedToTerms(checked === true)} />
            <span>{t("monetization.confirmTerms")}</span>
          </Label>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeEnrollment}>{t("monetization.cancel")}</AlertDialogCancel>
            <AlertDialogAction disabled={!agreedToTerms} onClick={enroll}>{t("monetization.confirmEnroll")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SummaryMetric({ icon: Icon, label, value, accent = false }: { icon: LucideIcon; label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex min-h-24 items-center gap-3 border-b border-border px-4 py-4 last:border-b-0 sm:border-r sm:[&:nth-child(2)]:border-r-0 xl:border-b-0 xl:[&:nth-child(2)]:border-r xl:last:border-r-0">
      <span className={`grid size-9 shrink-0 place-items-center rounded-lg border ${accent ? "border-primary/20 bg-primary/10 text-primary" : "border-border bg-muted/30 text-muted-foreground"}`}><Icon className="size-4" /></span>
      <div className="min-w-0">
        <p className="truncate text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-xl font-semibold tracking-[-0.02em] text-foreground tabular-nums">{value}</p>
      </div>
    </div>
  );
}

function FilterSelect({ label, id, children }: { label: string; id: string; children: ReactNode }) {
  return <div className="grid gap-2"><Label htmlFor={id}>{label}</Label>{children}</div>;
}

function LinksEmptyState({ icon: Icon, title, description, children }: { icon: LucideIcon; title: string; description: string; children: ReactNode }) {
  return (
    <div className="grid min-h-72 place-items-center rounded-xl border border-dashed border-border bg-card px-6 py-10 text-center">
      <div className="max-w-sm">
        <span className="mx-auto grid size-11 place-items-center rounded-xl border border-border bg-muted/30 text-muted-foreground"><Icon className="size-5" /></span>
        <h2 className="mt-4 text-base font-semibold tracking-[-0.01em] text-foreground">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

function LinksPageSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid overflow-hidden rounded-xl border border-border sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => <div key={item} className="flex min-h-24 items-center gap-3 border-b border-r border-border p-4"><Skeleton className="size-9 rounded-lg" /><div className="space-y-2"><Skeleton className="h-3 w-24" /><Skeleton className="h-6 w-14" /></div></div>)}
      </div>
      <Skeleton className="h-16 rounded-xl" />
      {[1, 2, 3].map((item) => <Skeleton key={item} className="h-52 rounded-xl" />)}
    </div>
  );
}
