"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Home,
  Link2,
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
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
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
    <div className="mb-5 flex">
      <div className="inline-flex w-full rounded-2xl bg-slate-100/70 p-1 ring-1 ring-slate-200/70 sm:w-auto">
        {linksTabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`inline-flex h-10 flex-1 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 text-sm font-bold transition-all duration-200 sm:flex-none sm:px-4 ${active
                ? "border-slate-200 bg-white text-slate-950 shadow-sm"
                : "border-transparent text-slate-500 hover:bg-white/60 hover:text-slate-900"
                }`}
            >
              <Icon size={16} />
              {tab.mobileLabelKey ? (
                <>
                  <span className="hidden sm:inline">{t(tab.labelKey)}</span>
                  <span className="sm:hidden">{t(tab.mobileLabelKey)}</span>
                </>
              ) : (
                t(tab.labelKey)
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LinksSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((row) => (
        <div key={row} className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="h-7 w-40 animate-pulse rounded-lg bg-slate-100" />
              <div className="h-5 w-96 max-w-full animate-pulse rounded-lg bg-slate-100" />
            </div>
            <div className="hidden gap-2 sm:flex">
              <div className="h-8 w-20 animate-pulse rounded-full bg-slate-100" />
              <div className="h-8 w-36 animate-pulse rounded-full bg-slate-100" />
            </div>
          </div>
          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex gap-3">
                <div className="h-11 w-32 animate-pulse rounded-xl bg-slate-100" />
                <div className="h-11 w-32 animate-pulse rounded-xl bg-slate-100" />
                <div className="h-11 w-24 animate-pulse rounded-xl bg-slate-100" />
              </div>
              <div className="hidden h-11 w-52 animate-pulse rounded-xl bg-slate-100 lg:block" />
            </div>
          </div>
        </div>
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

export function LinksView() {
  const t = useTranslations("Links");
  const commonT = useTranslations("Common");
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
    <button
      type="button"
      onClick={() => setActiveTab("create")}
      className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white shadow-[0_6px_16px_rgba(37,99,235,0.16)] transition hover:bg-blue-700"
    >
      <Plus size={16} />
      {t("createNew")}
    </button>
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
        <div className="space-y-5">
          {error ? (
            <EmptyState
              title={t("loadErrorTitle")}
              description={error}
              action={
                <AppButton>
                  <Plus size={16} />
                  {t("tryAgain")}
                </AppButton>
              }
            />
          ) : loading ? (
            <LinksSkeleton />
          ) : (
            <div className="space-y-5">
              <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white/90 p-3 shadow-[0_8px_24px_rgba(15,23,42,0.06)] sm:flex-row sm:items-center sm:justify-between">
                <div className="flex h-11 w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 sm:max-w-md">
                  <Search size={16} className="text-slate-400" />
                  <input
                    value={filters.query}
                    onChange={(event) => updateFilter("query", event.target.value)}
                    className="w-full bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
                    placeholder={t("searchPlaceholder")}
                  />
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <select
                    value={filters.sort}
                    onChange={(event) =>
                      updateFilter("sort", event.target.value as LinkSort)
                    }
                    className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none"
                  >
                    <option value="newest">{t("sort.newest")}</option>
                    <option value="oldest">{t("sort.oldest")}</option>
                    <option value="clicks-desc">{t("sort.clicksDesc")}</option>
                    <option value="title-asc">{t("sort.titleAsc")}</option>
                    <option value="actions-desc">{t("sort.actionsDesc")}</option>
                  </select>

                  <Drawer
                    key={filterDirection}
                    open={filterOpen}
                    onOpenChange={setFilterOpen}
                    direction={filterDirection}
                  >
                    <DrawerTrigger asChild>
                      <button
                        type="button"
                        className="relative inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/70"
                      >
                        <Filter size={16} />
                        {t("filter")}
                        {activeFilterCount > 0 ? (
                          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-blue-600 px-1.5 text-[11px] font-black text-white">
                            {activeFilterCount}
                          </span>
                        ) : null}
                      </button>
                    </DrawerTrigger>

                    <DrawerContent
                      className={[
                        "overflow-hidden border-slate-200 bg-white text-slate-900",
                        isDesktopFilter
                          ? "sm:max-w-md"
                          : "max-h-[86dvh] rounded-t-2xl",
                      ].join(" ")}
                    >
                      <DrawerHeader className="border-b border-slate-200 px-5 py-4 text-left">
                        <DrawerTitle className="flex items-center gap-2 text-base font-bold text-slate-950">
                          <Filter size={17} className="text-blue-600" />
                          {t("filter")}
                        </DrawerTitle>
                        <p className="text-sm font-medium leading-6 text-slate-500">
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
                          <label className="grid gap-2">
                            <span className="text-sm font-bold text-slate-700">{t("status")}</span>
                            <select
                              value={filters.status}
                              onChange={(event) =>
                                updateFilter("status", event.target.value as LinkStatusFilter)
                              }
                              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none"
                            >
                              <option value="all">{t("allStatus")}</option>
                              <option value="active">{t("statusActive")}</option>
                              <option value="inactive">{t("statusInactive")}</option>
                              <option value="paused">{t("statusPaused")}</option>
                            </select>
                          </label>

                          <label className="grid gap-2">
                            <span className="text-sm font-bold text-slate-700">{t("type")}</span>
                            <select
                              value={filters.inputType}
                              onChange={(event) =>
                                updateFilter("inputType", event.target.value as LinkTypeFilter)
                              }
                              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none"
                            >
                              <option value="all">{t("allTypes")}</option>
                              <option value="url">{t("typeUrl")}</option>
                              <option value="file">{t("typeFile")}</option>
                              <option value="snippet">{t("typeSnippet")}</option>
                            </select>
                          </label>

                          <label className="grid gap-2">
                            <span className="text-sm font-bold text-slate-700">{t("platform")}</span>
                            <select
                              value={filters.platform}
                              onChange={(event) => updateFilter("platform", event.target.value)}
                              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none"
                            >
                              <option value="all">{t("allPlatforms")}</option>
                              {platformOptions.map((platform) => (
                                <option key={platform} value={platform}>
                                  {platform}
                                </option>
                              ))}
                            </select>
                          </label>

                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <label className="grid gap-2">
                              <span className="text-sm font-bold text-slate-700">{t("fromDate")}</span>
                              <input
                                type="date"
                                value={filters.createdFrom}
                                onChange={(event) => updateFilter("createdFrom", event.target.value)}
                                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none"
                              />
                            </label>

                            <label className="grid gap-2">
                              <span className="text-sm font-bold text-slate-700">{t("toDate")}</span>
                              <input
                                type="date"
                                value={filters.createdTo}
                                onChange={(event) => updateFilter("createdTo", event.target.value)}
                                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none"
                              />
                            </label>
                          </div>

                          <label className="grid gap-2">
                            <span className="text-sm font-bold text-slate-700">{t("minClicks")}</span>
                            <input
                              type="number"
                              min={0}
                              value={filters.minClicks}
                              onChange={(event) => updateFilter("minClicks", event.target.value)}
                              placeholder={t("minClicksPlaceholder")}
                              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none placeholder:text-slate-400"
                            />
                          </label>

                          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-blue-200 hover:bg-blue-50">
                            <input
                              type="checkbox"
                              checked={filters.highPerformance}
                              onChange={(event) =>
                                updateFilter("highPerformance", event.target.checked)
                              }
                              className="mt-1 size-4 rounded border-slate-300 text-blue-600"
                            />
                            <span>
                              <span className="block text-sm font-bold text-slate-800">
                                {t("highPerformance")}
                              </span>
                              <span className="mt-0.5 block text-xs font-semibold text-slate-500">
                                {t("highPerformanceDescription")}
                              </span>
                            </span>
                          </label>
                        </div>

                        <div className="flex gap-2 border-t border-slate-200 bg-white px-5 py-4">
                          <button
                            type="button"
                            onClick={() => setFilters(defaultLinkFilters)}
                            className="inline-flex h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
                          >
                            <RotateCcw size={15} />
                            {t("reset")}
                          </button>

                          <button
                            type="button"
                            onClick={() => setFilterOpen(false)}
                            className="inline-flex h-10 flex-1 cursor-pointer items-center justify-center rounded-xl bg-blue-600 px-3 text-sm font-bold text-white transition hover:bg-blue-700"
                          >
                            {t("apply")}
                          </button>
                        </div>
                      </div>
                    </DrawerContent>
	                  </Drawer>
	                </div>
	              </div>

              <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-600">
                  <SlidersHorizontal size={16} className="text-blue-600" />
                  <span>
                    {t("showing", {
                      first: firstItem,
                      last: lastItem,
                      total: filteredLinks.length,
                    })}
                  </span>
                  {usingDemoData ? (
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-700 ring-1 ring-amber-100">
                      {t("demoData")}
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-500">{t("rows")}</span>
                  <select
                    value={pageSize}
                    onChange={(event) => {
                      setPage(1);
                      setPageSize(Number(event.target.value));
                    }}
                    className="h-9 rounded-xl border border-slate-200 bg-white px-2 text-sm font-bold text-slate-700 outline-none"
                  >
                    {pageSizeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={safePage === 1}
                    className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="min-w-16 text-center text-sm font-black text-slate-700">
                    {safePage}/{totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    disabled={safePage === totalPages}
                    className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

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
                    <button
                      type="button"
                      onClick={() => setFilters(defaultLinkFilters)}
                      className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                    >
                      <RotateCcw size={16} />
                      {t("resetFilters")}
                    </button>
                  }
                />
              ) : (
                <section className="space-y-4">
                  {paginatedLinks.map((link) => (
                    <LinkCard key={link.id} link={link} />
                  ))}
                </section>
              )}
            </div>
          )}
        </div>
      ) : null}

      {activeTab === "create" ? (
        <SocialLinksGenerator embedded />
      ) : null}

      {activeTab === "monetization" ? (
        <div className="space-y-5">{t("tabs.monetization")}: {commonT("comingSoon")}</div>
      ) : null}
    </>
  );
}
