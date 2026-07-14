"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  CircleSlash,
  Filter,
  Home,
  Link2,
  Megaphone,
  MonitorSmartphone,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import SocialLinksGenerator from "@/features/link-creation/components/link-creator";
import { LinkCard } from "./link-card";
import {
  AppButton,
  EmptyState,
  PageHeader,
} from "@/components/dashboard/ui";
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
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getLinks, type LinkDto } from "@/lib/api-client";
import { filterLinks, sortLinks } from "../lib/filter-links";
import {
  defaultLinkFilters,
  type LinkFilters,
  type LinkSort,
  type LinkStatusFilter,
  type LinkTypeFilter,
  type LinksTab,
} from "../types";

const linksTabs: Array<{
  id: LinksTab;
  labelKey: string;
  mobileLabelKey?: string;
  icon: LucideIcon;
}> = [
  { id: "overview", labelKey: "tabs.overview", icon: Home },
  { id: "create", labelKey: "tabs.create", icon: Plus },
  {
    id: "monetization",
    labelKey: "tabs.monetization",
    mobileLabelKey: "tabs.mobileMonetization",
    icon: Link2,
  },
];

const pageSizeOptions = [5, 10, 20];

const demoLinks: LinkDto[] = [
  {
    id: "demo-youtube-launch",
    slug: "music-drop",
    shortUrl: "/l/music-drop",
    destinationUrl: "https://open.spotify.com/artist/demo",
    title: "Music drop unlock",
    inputType: "url",
    selectedSnippet: null,
    selectedFile: null,
    subtitle: "Follow and watch to unlock the new track.",
    customAlias: "music-drop",
    coverImageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80",
    expiryEnabled: false,
    expiryType: null,
    expiryDate: null,
    expiryTime: null,
    maxClicks: null,
    clicks: 1820,
    status: "active",
    actions: [
      {
        id: "demo-action-youtube-watch",
        platform: "youtube",
        action: "watch",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
      {
        id: "demo-action-spotify-follow",
        platform: "spotify",
        action: "follow-artist",
        url: "https://open.spotify.com/artist/demo",
      },
    ],
    backgroundSettings: {
      selectedBackgroundId: "1",
      selectedBackgroundName: "Neon Flow",
      backgroundMediaType: "image",
      backgroundMediaUrl: "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1400&q=80",
      sameAsCoverImage: false,
      effects: {
        opacity: 100,
        blur: 0,
        saturation: 100,
        contrast: 100,
        grayscale: 0,
      },
    },
    createdAt: "2026-07-08T09:30:00.000Z",
    updatedAt: "2026-07-10T15:12:00.000Z",
  },
  {
    id: "demo-file-pack",
    slug: "creator-pack",
    shortUrl: "/l/creator-pack",
    destinationUrl: "/api/files/demo-pack/download",
    title: "Creator preset pack",
    inputType: "file",
    selectedSnippet: null,
    selectedFile: "demo-file-pack",
    subtitle: "Complete social actions to download the preset pack.",
    customAlias: "creator-pack",
    coverImageUrl: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=800&q=80",
    expiryEnabled: true,
    expiryType: "clicks",
    expiryDate: null,
    expiryTime: null,
    maxClicks: 5000,
    clicks: 742,
    status: "active",
    actions: [
      {
        id: "demo-action-instagram-follow",
        platform: "instagram",
        action: "follow",
        url: "https://instagram.com/demo",
      },
      {
        id: "demo-action-tiktok-follow",
        platform: "tiktok",
        action: "follow",
        url: "https://tiktok.com/@demo",
      },
    ],
    backgroundSettings: {
      selectedBackgroundId: "6",
      selectedBackgroundName: "Chromatic Wave",
      backgroundMediaType: "image",
      backgroundMediaUrl: "https://images.unsplash.com/photo-1557682250-33bd709cbe85?auto=format&fit=crop&w=1400&q=80",
      sameAsCoverImage: false,
      effects: {
        opacity: 100,
        blur: 0,
        saturation: 100,
        contrast: 100,
        grayscale: 0,
      },
    },
    createdAt: "2026-07-05T11:00:00.000Z",
    updatedAt: "2026-07-09T08:30:00.000Z",
  },
  {
    id: "demo-snippet-coupon",
    slug: "summer-code",
    shortUrl: "/l/summer-code",
    destinationUrl: "SUMMER-25-OFF",
    title: "Summer coupon code",
    inputType: "snippet",
    selectedSnippet: "demo-snippet-coupon",
    selectedFile: null,
    subtitle: "Reveal a limited coupon after joining the community.",
    customAlias: "summer-code",
    coverImageUrl: null,
    expiryEnabled: true,
    expiryType: "date",
    expiryDate: "2026-08-01T00:00:00.000Z",
    expiryTime: "23:59",
    maxClicks: null,
    clicks: 96,
    status: "paused",
    actions: [
      {
        id: "demo-action-discord-join",
        platform: "discord",
        action: "join-server",
        url: "https://discord.gg/demo",
      },
    ],
    backgroundSettings: {
      selectedBackgroundId: "youtube",
      selectedBackgroundName: "YouTube video",
      backgroundMediaType: "youtube",
      backgroundMediaUrl: "https://www.youtube.com/watch?v=3EEnvO0yMHY",
      sameAsCoverImage: false,
      effects: {
        opacity: 100,
        blur: 0,
        saturation: 100,
        contrast: 100,
        grayscale: 0,
      },
    },
    createdAt: "2026-06-28T14:45:00.000Z",
    updatedAt: "2026-07-01T13:20:00.000Z",
  },
  {
    id: "demo-product-hunt",
    slug: "launch-upvote",
    shortUrl: "/l/launch-upvote",
    destinationUrl: "https://www.producthunt.com/posts/demo",
    title: "Product launch boost",
    inputType: "url",
    selectedSnippet: null,
    selectedFile: null,
    subtitle: "Upvote and follow the maker to unlock the bonus.",
    customAlias: "launch-upvote",
    coverImageUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80",
    expiryEnabled: false,
    expiryType: null,
    expiryDate: null,
    expiryTime: null,
    maxClicks: null,
    clicks: 311,
    status: "inactive",
    actions: [
      {
        id: "demo-action-producthunt-upvote",
        platform: "productHunt",
        action: "upvote-product",
        url: "https://www.producthunt.com/posts/demo",
      },
      {
        id: "demo-action-twitter-follow",
        platform: "twitter",
        action: "follow",
        url: "https://x.com/demo",
      },
    ],
    backgroundSettings: {
      selectedBackgroundId: "15",
      selectedBackgroundName: "Midnight Bloom",
      backgroundMediaType: "image",
      backgroundMediaUrl: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1400&q=80",
      sameAsCoverImage: false,
      effects: {
        opacity: 100,
        blur: 0,
        saturation: 100,
        contrast: 100,
        grayscale: 0,
      },
    },
    createdAt: "2026-06-16T10:15:00.000Z",
    updatedAt: "2026-06-22T16:00:00.000Z",
  },
  {
    id: "demo-community-telegram",
    slug: "join-channel",
    shortUrl: "/l/join-channel",
    destinationUrl: "https://t.me/demo",
    title: "Telegram community invite",
    inputType: "url",
    selectedSnippet: null,
    selectedFile: null,
    subtitle: "Join the channel and unlock the private resource.",
    customAlias: "join-channel",
    coverImageUrl: null,
    expiryEnabled: false,
    expiryType: null,
    expiryDate: null,
    expiryTime: null,
    maxClicks: null,
    clicks: 58,
    status: "active",
    actions: [
      {
        id: "demo-action-telegram-join",
        platform: "telegram",
        action: "join-channel",
        url: "https://t.me/demo",
      },
    ],
    backgroundSettings: {
      selectedBackgroundId: "17",
      selectedBackgroundName: "Tropical Echo",
      backgroundMediaType: "image",
      backgroundMediaUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80",
      sameAsCoverImage: false,
      effects: {
        opacity: 100,
        blur: 0,
        saturation: 100,
        contrast: 100,
        grayscale: 0,
      },
    },
    createdAt: "2026-06-10T08:00:00.000Z",
    updatedAt: "2026-06-11T09:00:00.000Z",
  },
];

function LinksTabs({
  activeTab,
  onChange,
}: {
  activeTab: LinksTab;
  onChange: (tab: LinksTab) => void;
}) {
  const t = useTranslations("Links");

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => onChange(value as LinksTab)}
      className="mb-6"
    >
      <TabsList variant="line" className="h-10 w-full justify-start gap-0 rounded-none border-b border-border bg-transparent p-0">
        {linksTabs.map((tab) => {
          const Icon = tab.icon;

          return (
            <TabsTrigger key={tab.id} value={tab.id} className="h-10 flex-1 rounded-none border-0 px-3 text-sm font-medium text-muted-foreground shadow-none after:bg-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none sm:flex-none sm:px-4">
              <Icon />
              {tab.mobileLabelKey ? (
                <>
                  <span className="hidden sm:inline">{t(tab.labelKey)}</span>
                  <span className="sm:hidden">{t(tab.mobileLabelKey)}</span>
                </>
              ) : (
                t(tab.labelKey)
              )}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}

function LinksSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((row) => (
        <Card key={row} className="gap-0 overflow-hidden rounded-xl border-border bg-card p-0 shadow-none">
          <div className="flex items-start justify-between gap-4 border-b border-border p-4 sm:px-5">
            <div className="space-y-3">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-5 w-96 max-w-full" />
            </div>
            <div className="hidden gap-2 sm:flex">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-36 rounded-full" />
            </div>
          </div>
          <div className="border-t-0 bg-muted/25 p-3 sm:px-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex gap-3">
                <Skeleton className="h-9 w-28" />
                <Skeleton className="h-9 w-28" />
                <Skeleton className="h-9 w-24" />
              </div>
              <Skeleton className="hidden h-9 w-52 lg:block" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

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

type MonetizationPlanId = "clean" | "faucet" | "low" | "balanced" | "high" | "maximum";
type AdDensity = "none" | "limited" | "maximum";

function MonetizationPanel() {
  const t = useTranslations("Links");
  const [currentPlanId, setCurrentPlanId] = useState<MonetizationPlanId>("high");
  const [pendingPlanId, setPendingPlanId] = useState<MonetizationPlanId | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const plans: Array<{
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
  ];
  const currentPlan = plans.find((plan) => plan.id === currentPlanId) ?? plans[0];
  const pendingPlan = plans.find((plan) => plan.id === pendingPlanId) ?? null;
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
      <Card className="gap-0 rounded-xl border-border bg-muted/30 px-4 py-3 shadow-none sm:flex-row sm:items-center sm:px-5">
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
        <h3 id="monetization-plans" className="sr-only">{t("monetization.plansTitle")}</h3>
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlanId;

          return (
            <Card
              key={plan.id}
              className={[
                "gap-0 overflow-hidden rounded-xl border bg-card p-0 shadow-none transition-colors duration-200 hover:border-foreground/20",
                isCurrent ? "border-primary/50 ring-1 ring-primary/10" : "border-border",
              ].join(" ")}
            >
              <CardHeader className="px-5 pt-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">{t(`monetization.plans.${plan.id}.title`)}</CardTitle>
                    <CardDescription className="mt-1 leading-5">{t(`monetization.plans.${plan.id}.description`)}</CardDescription>
                  </div>
                  {isCurrent ? <Badge className="shrink-0 bg-primary text-primary-foreground hover:bg-primary">{t("monetization.active")}</Badge> : null}
                </div>
              </CardHeader>

              <CardContent className="space-y-5 px-5 py-5">
                <div className="grid grid-cols-2 divide-x divide-border rounded-lg border border-border bg-muted/30">
                  <div className="px-3 py-3">
                    <p className="text-xs font-medium text-muted-foreground">{t("monetization.profit")}</p>
                    <p className="mt-1 text-xl font-semibold tracking-tight text-foreground">{plan.profit}</p>
                  </div>
                  <div className="px-3 py-3">
                    <p className="text-xs font-medium text-muted-foreground">{t("monetization.steps")}</p>
                    <p className="mt-1 text-xl font-semibold tracking-tight text-foreground">{plan.steps}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("monetization.visitorExperience")}</p>
                  {adTypes.map((adType) => {
                    const density = plan.ads[adType];
                    const isDisabled = density === "none";

                    return (
                      <div key={adType} className="flex items-center gap-3">
                        <span className={isDisabled ? "grid size-7 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground" : "grid size-7 shrink-0 place-items-center rounded-md bg-primary/10 text-primary"}>
                          {isDisabled ? <CircleSlash className="size-4" /> : <Megaphone className="size-4" />}
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

              <CardFooter className="border-t border-border bg-muted/15 px-5 py-4">
                {isCurrent ? (
                  <Button className="w-full shadow-none" disabled><Check />{t("monetization.active")}</Button>
                ) : (
                  <Button type="button" variant="outline" className="w-full border-border shadow-none" onClick={() => setPendingPlanId(plan.id)}>
                    <MonitorSmartphone />
                    {t("monetization.enroll")}
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </section>

      <Card className="gap-0 overflow-hidden rounded-xl border-border shadow-none">
        <CardHeader className="flex flex-col gap-3 border-b border-border sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>{t("monetization.payoutTitle")}</CardTitle>
            <CardDescription className="mt-1 leading-5">{t("monetization.payoutDescription")}</CardDescription>
          </div>
          <Badge variant="secondary" className="w-fit bg-primary/10 text-primary hover:bg-primary/10">
            {t("monetization.contextProfit", { profit: currentPlan.profit })}
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[580px] text-sm">
              <caption className="sr-only">{t("monetization.payoutTitle")}</caption>
              <thead className="border-b border-border bg-muted/30 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th scope="col" className="px-5 py-3 text-left sm:px-6">{t("monetization.country")}</th>
                  <th scope="col" className="px-5 py-3 text-right sm:px-6">{t("monetization.desktopCpm")}</th>
                  <th scope="col" className="px-5 py-3 text-right sm:px-6">{t("monetization.mobileCpm")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payoutRates.map((rate) => (
                  <tr key={rate.country} className="transition-colors hover:bg-muted/30">
                    <td className="px-5 py-3 sm:px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={`https://flagcdn.com/w80/${rate.code.toLowerCase()}.png`}
                          alt=""
                          className="size-7 rounded-full border border-border bg-background object-cover"
                        />
                        <span className="font-medium text-foreground">{t(`monetization.countries.${rate.country}`)}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold tabular-nums text-primary sm:px-6">{formatCpm(rate.desktopBase)}</td>
                    <td className="px-5 py-3 text-right font-semibold tabular-nums text-primary sm:px-6">{formatCpm(rate.mobileBase)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
        <CardFooter className="border-t border-border bg-muted/20 px-5 py-3 text-xs leading-5 text-muted-foreground sm:px-6">
          {t("monetization.payoutNote")}
        </CardFooter>
      </Card>

      <AlertDialog open={Boolean(pendingPlan)} onOpenChange={(open) => !open && closeEnrollment()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("monetization.confirmTitle", { plan: pendingPlan ? t(`monetization.plans.${pendingPlan.id}.title`) : "" })}</AlertDialogTitle>
            <AlertDialogDescription>{t("monetization.confirmDescription", { profit: pendingPlan?.profit ?? "", steps: pendingPlan?.steps ?? 0 })}</AlertDialogDescription>
          </AlertDialogHeader>
          <Label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-muted/30 p-3 text-sm font-normal leading-5 text-muted-foreground">
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

export function LinksView() {
  const t = useTranslations("Links");
  const [links, setLinks] = useState<LinkDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<LinksTab>("overview");
  const [filters, setFilters] = useState<LinkFilters>(defaultLinkFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [filterOpen, setFilterOpen] = useState(false);
  const isDesktopFilter = useMediaQuery("(min-width: 768px)");
  const filterDirection = isDesktopFilter ? "right" : "bottom";

  useEffect(() => {
    let mounted = true;

    async function loadLinks() {
      try {
        const data = await getLinks();
        if (mounted) {
          setLinks(data);
          setError("");
        }
      } catch (loadError) {
        if (mounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : t("loadErrorFallback"),
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadLinks();
    window.addEventListener("Rekonise:link-created", loadLinks);

    return () => {
      mounted = false;
      window.removeEventListener("Rekonise:link-created", loadLinks);
    };
  }, [t]);

  const sourceLinks = links.length > 0 ? links : demoLinks;
  const usingDemoData = !loading && !error && links.length === 0;

  const platformOptions = useMemo(() => {
    return Array.from(
      new Set(sourceLinks.flatMap((link) => link.actions.map((action) => action.platform))),
    ).sort((first, second) => first.localeCompare(second));
  }, [sourceLinks]);

  const filteredLinks = useMemo(() => {
    return sortLinks(filterLinks(sourceLinks, filters), filters.sort);
  }, [filters, sourceLinks]);

  const totalPages = Math.max(1, Math.ceil(filteredLinks.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedLinks = filteredLinks.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );
  const firstItem = filteredLinks.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const lastItem = Math.min(safePage * pageSize, filteredLinks.length);
  const activeFilterCount = [
    filters.status !== "all",
    filters.inputType !== "all",
    filters.platform !== "all",
    Boolean(filters.createdFrom),
    Boolean(filters.createdTo),
    Boolean(filters.minClicks),
    filters.highPerformance,
  ].filter(Boolean).length;

  const updateFilter = <Key extends keyof LinkFilters>(
    key: Key,
    value: LinkFilters[Key],
  ) => {
    setPage(1);
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const createLinkButton = (
    <Button
      type="button"
      onClick={() => setActiveTab("create")}
      size="lg"
      className="h-10 rounded-lg bg-primary px-4 font-medium text-primary-foreground shadow-none hover:bg-primary/90"
    >
      <Plus />
      {t("createNew")}
    </Button>
  );

  return (
    <>
      <PageHeader
        eyebrow={t("management")}
        title={t("socialLinks")}
        description={t("description")}
      />

      <LinksTabs activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "overview" ? (
        <div className="space-y-6">
          {error ? (
            <Alert variant="destructive" className="rounded-lg border-destructive/30 shadow-none">
              <AlertTitle>{t("loadErrorTitle")}</AlertTitle>
              <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span>{error}</span>
                <AppButton variant="secondary" className="h-9 shrink-0 px-3">
                  {t("tryAgain")}
                </AppButton>
              </AlertDescription>
            </Alert>
          ) : loading ? (
            <LinksSkeleton />
          ) : (
            <div className="space-y-5">
              <Card className="flex flex-col gap-3 rounded-none border-x-0 border-border bg-transparent px-0 py-3 shadow-none sm:flex-row sm:items-center sm:justify-between">
                <div className="flex h-10 w-full items-center gap-2 rounded-lg border border-border bg-background px-3 sm:max-w-md">
                  <Search aria-hidden className="size-4 text-muted-foreground" />
                  <Input
                    aria-label={t("searchPlaceholder")}
                    value={filters.query}
                    onChange={(event) => updateFilter("query", event.target.value)}
                    className="h-8 border-0 bg-transparent px-0 text-sm font-medium shadow-none focus-visible:ring-0"
                    placeholder={t("searchPlaceholder")}
                  />
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Select
                    value={filters.sort}
                    onValueChange={(value) => updateFilter("sort", value as LinkSort)}
                  >
                    <SelectTrigger className="h-10 w-full rounded-lg border-border bg-background font-medium shadow-none sm:w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">{t("sort.newest")}</SelectItem>
                      <SelectItem value="oldest">{t("sort.oldest")}</SelectItem>
                      <SelectItem value="clicks-desc">{t("sort.clicksDesc")}</SelectItem>
                      <SelectItem value="title-asc">{t("sort.titleAsc")}</SelectItem>
                      <SelectItem value="actions-desc">{t("sort.actionsDesc")}</SelectItem>
                    </SelectContent>
                  </Select>

                  <Drawer
                    key={filterDirection}
                    open={filterOpen}
                    onOpenChange={setFilterOpen}
                    direction={filterDirection}
                  >
                    <DrawerTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="relative h-10 rounded-lg border-border bg-background px-4 font-medium text-muted-foreground shadow-none hover:bg-accent hover:text-foreground"
                      >
                        <Filter />
                        {t("filter")}
                        {activeFilterCount > 0 ? (
                          <Badge className="min-w-5 justify-center rounded-full bg-primary px-1.5 py-0.5 text-[11px] text-primary-foreground hover:bg-primary">
                            {activeFilterCount}
                          </Badge>
                        ) : null}
                      </Button>
                    </DrawerTrigger>

                    <DrawerContent
                      className={[
                        "overflow-hidden border-border bg-background text-foreground",
                        isDesktopFilter
                          ? "sm:max-w-md"
                          : "max-h-[86dvh] rounded-t-2xl",
                      ].join(" ")}
                    >
                      <DrawerHeader className="border-b border-border px-5 py-4 text-left">
                        <DrawerTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                          <Filter size={17} className="text-primary" />
                          {t("filter")}
                        </DrawerTitle>
                        <p className="text-sm font-normal leading-6 text-muted-foreground">
                          {t("filterDescription")}
                        </p>
                      </DrawerHeader>

                      <div
                        className={[
                          "flex flex-col",
                          isDesktopFilter
                            ? "h-[calc(100dvh-89px)]"
                            : "max-h-[calc(86dvh-89px)]",
                        ].join(" ")}
                      >
                        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="links-status">{t("status")}</Label>
                            <Select
                              value={filters.status}
                              onValueChange={(value) => updateFilter("status", value as LinkStatusFilter)}
                            >
                              <SelectTrigger id="links-status" className="h-10 w-full rounded-lg">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">{t("allStatus")}</SelectItem>
                                <SelectItem value="active">{t("statusActive")}</SelectItem>
                                <SelectItem value="inactive">{t("statusInactive")}</SelectItem>
                                <SelectItem value="paused">{t("statusPaused")}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor="links-type">{t("type")}</Label>
                            <Select
                              value={filters.inputType}
                              onValueChange={(value) => updateFilter("inputType", value as LinkTypeFilter)}
                            >
                              <SelectTrigger id="links-type" className="h-10 w-full rounded-lg">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">{t("allTypes")}</SelectItem>
                                <SelectItem value="url">{t("typeUrl")}</SelectItem>
                                <SelectItem value="file">{t("typeFile")}</SelectItem>
                                <SelectItem value="snippet">{t("typeSnippet")}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor="links-platform">{t("platform")}</Label>
                            <Select
                              value={filters.platform}
                              onValueChange={(value) => updateFilter("platform", value)}
                            >
                              <SelectTrigger id="links-platform" className="h-10 w-full rounded-lg">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">{t("allPlatforms")}</SelectItem>
                                {platformOptions.map((platform) => (
                                  <SelectItem key={platform} value={platform}>
                                    {platform}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="grid gap-2">
                              <Label htmlFor="links-created-from">{t("fromDate")}</Label>
                              <Input
                                id="links-created-from"
                                type="date"
                                value={filters.createdFrom}
                                onChange={(event) => updateFilter("createdFrom", event.target.value)}
                                className="h-10 rounded-lg font-medium"
                              />
                            </div>

                            <div className="grid gap-2">
                              <Label htmlFor="links-created-to">{t("toDate")}</Label>
                              <Input
                                id="links-created-to"
                                type="date"
                                value={filters.createdTo}
                                onChange={(event) => updateFilter("createdTo", event.target.value)}
                                className="h-10 rounded-lg font-medium"
                              />
                            </div>
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor="links-min-clicks">{t("minClicks")}</Label>
                            <Input
                              id="links-min-clicks"
                              type="number"
                              min={0}
                              value={filters.minClicks}
                              onChange={(event) => updateFilter("minClicks", event.target.value)}
                              placeholder={t("minClicksPlaceholder")}
                              className="h-10 rounded-lg font-medium"
                            />
                          </div>

                          <Label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/30 hover:bg-accent/50">
                            <Checkbox
                              checked={filters.highPerformance}
                              onCheckedChange={(checked) => updateFilter("highPerformance", checked === true)}
                              className="mt-0.5"
                            />
                            <span>
                              <span className="block text-sm font-medium text-foreground">
                                {t("highPerformance")}
                              </span>
                              <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                                {t("highPerformanceDescription")}
                              </span>
                            </span>
                          </Label>
                        </div>

                        <div className="flex gap-2 border-t border-border bg-background px-5 py-4">
                          <Button
                            type="button"
                            onClick={() => setFilters(defaultLinkFilters)}
                            variant="outline"
                            className="h-10 flex-1 rounded-lg border-border font-medium text-muted-foreground shadow-none hover:text-foreground"
                          >
                            <RotateCcw />
                            {t("reset")}
                          </Button>

                          <Button
                            type="button"
                            onClick={() => setFilterOpen(false)}
                            className="h-10 flex-1 rounded-lg bg-primary px-3 font-medium text-primary-foreground shadow-none hover:bg-primary/90"
                          >
                            {t("apply")}
                          </Button>
                        </div>
                      </div>
                    </DrawerContent>
	                  </Drawer>
	                </div>
              </Card>

              {sourceLinks.length === 0 ? (
                <EmptyState
                  title={t("emptyTitle")}
                  description={t("emptyDescription")}
                  action={createLinkButton}
                />
              ) : filteredLinks.length === 0 ? (
                <EmptyState
                  title={t("notFound")}
                  description={t("notFoundDescription")}
                  action={
                    <Button
                      type="button"
                      onClick={() => setFilters(defaultLinkFilters)}
                      variant="outline"
                      size="lg"
                      className="h-10 rounded-lg border-border font-medium text-foreground shadow-none"
                    >
                      <RotateCcw />
                      {t("resetFilters")}
                    </Button>
                  }
                />
              ) : (
                <section className="space-y-3">
                  {paginatedLinks.map((link) => (
                    <LinkCard key={link.id} link={link} />
                  ))}
                </section>
              )}


              <Card className="flex flex-col gap-3 rounded-none border-x-0 border-b-0 border-border bg-transparent px-0 py-3 shadow-none sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-muted-foreground">
                  <SlidersHorizontal className="size-4 text-primary" />
                  <span>
                    {t("showing", {
                      first: firstItem,
                      last: lastItem,
                      total: filteredLinks.length,
                    })}
                  </span>
                  {usingDemoData ? (
                    <Badge variant="secondary" className="border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400">
                      {t("demoData")}
                    </Badge>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">{t("rows")}</span>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(value) => {
                      setPage(1);
                      setPageSize(Number(value));
                    }}
                  >
                    <SelectTrigger className="h-9 w-16 rounded-lg border-border bg-background px-2 font-medium shadow-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {pageSizeOptions.map((option) => (
                        <SelectItem key={option} value={String(option)}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={safePage === 1}
                    variant="outline"
                    size="icon"
                    className="size-9 rounded-lg border-border bg-background shadow-none"
                    aria-label="Previous page"
                  >
                    <ChevronLeft />
                  </Button>
                  <span className="min-w-16 text-center text-sm font-medium text-foreground" aria-live="polite">
                    {safePage}/{totalPages}
                  </span>
                  <Button
                    type="button"
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    disabled={safePage === totalPages}
                    variant="outline"
                    size="icon"
                    className="size-9 rounded-lg border-border bg-background shadow-none"
                    aria-label="Next page"
                  >
                    <ChevronRight />
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      ) : null}

      {activeTab === "create" ? (
        <SocialLinksGenerator embedded />
      ) : null}

      {activeTab === "monetization" ? (
        <MonetizationPanel />
      ) : null}
    </>
  );
}
