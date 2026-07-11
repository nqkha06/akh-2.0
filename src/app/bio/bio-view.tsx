"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  BarChart3,
  Copy,
  ExternalLink,
  Home,
  Link2,
  MousePointerClick,
  Plus,
  Smartphone,
  TrendingUp,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Badge, SoftCard, StatCard } from "@/components/dashboard/ui";
import { getBioPages, type BioPageDto } from "@/lib/api-client";
import LinkInBioGenerator from "./link-in-bio-generator";

type BioTab = "overview" | "create" | "analytics";

const bioTabs: Array<{
  id: BioTab;
  label: string;
  mobileLabel?: string;
  icon: LucideIcon;
}> = [
  { id: "overview", label: "Overview", icon: Home },
  { id: "create", label: "Create", icon: Plus },
  { id: "analytics", label: "Analytics", mobileLabel: "Stats", icon: BarChart3 },
];

const channelRows = [
  { source: "Instagram", views: 940, color: "bg-pink-500" },
  { source: "TikTok", views: 730, color: "bg-slate-900" },
  { source: "YouTube", views: 516, color: "bg-red-500" },
  { source: "Direct", views: 232, color: "bg-blue-500" },
];

function BioTabs({
  activeTab,
  onChange,
}: {
  activeTab: BioTab;
  onChange: (tab: BioTab) => void;
}) {
  return (
    <div className="mb-5 flex">
      <div className="inline-flex w-full rounded-2xl bg-slate-100/70 p-1 ring-1 ring-slate-200/70 sm:w-auto">
        {bioTabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`inline-flex h-10 flex-1 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 text-sm font-bold transition-all duration-200 sm:flex-none sm:px-4 ${
                active
                  ? "border-slate-200 bg-white text-slate-950 shadow-sm"
                  : "border-transparent text-slate-500 hover:bg-white/60 hover:text-slate-900"
              }`}
            >
              <Icon size={16} />
              {tab.mobileLabel ? (
                <>
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.mobileLabel}</span>
                </>
              ) : (
                tab.label
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function BioView() {
  const [activeTab, setActiveTab] = useState<BioTab>("overview");
  const [bioPages, setBioPages] = useState<BioPageDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadBioPages = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getBioPages();
      setBioPages(data);
      setError("");
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Không tải được danh sách bio.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadBioPages);
  }, [loadBioPages]);

  const handleBioCreated = (bioPage: BioPageDto) => {
    setBioPages((current) => [bioPage, ...current.filter((item) => item.id !== bioPage.id)]);
    setActiveTab("overview");
  };

  return (
    <>
      <header className="mb-4 border-b border-slate-200/80 pb-4">
        <nav className="mb-3 flex items-center gap-1 text-xs font-semibold text-slate-400">
          <span>Home</span>
          <span>/</span>
          <span className="text-slate-600">Link-in-bio</span>
        </nav>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
              Link-in-bio
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
              Quản lý trang bio, tạo landing mini và theo dõi hiệu suất từng
              link trong cùng một workspace.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab("create")}
            className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white shadow-[0_6px_16px_rgba(37,99,235,0.16)] transition hover:bg-blue-700"
          >
            <Plus size={16} />
            Create bio
          </button>
        </div>
      </header>

      <BioTabs activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "overview" ? (
        <BioOverview
          bioPages={bioPages}
          error={error}
          loading={loading}
          onCreate={() => setActiveTab("create")}
        />
      ) : null}

      {activeTab === "create" ? (
        <LinkInBioGenerator showHeader={false} onCreated={handleBioCreated} />
      ) : null}

      {activeTab === "analytics" ? <BioAnalytics bioPages={bioPages} /> : null}
    </>
  );
}

function BioOverview({
  bioPages,
  error,
  loading,
  onCreate,
}: {
  bioPages: BioPageDto[];
  error: string;
  loading: boolean;
  onCreate: () => void;
}) {
  const totalViews = bioPages.reduce((sum, page) => sum + page.views, 0);
  const totalClicks = bioPages.reduce((sum, page) => sum + page.clicks, 0);
  const publishedCount = bioPages.filter((page) => page.status === "published").length;
  const ctr = totalViews > 0 ? `${((totalClicks / totalViews) * 100).toFixed(1)}%` : "0%";

  return (
    <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Bio pages"
          value={bioPages.length.toString()}
          detail={`${publishedCount} published`}
          icon={<Smartphone size={18} />}
          tone="blue"
        />
        <StatCard
          label="Views"
          value={totalViews.toLocaleString("vi-VN")}
          detail="Tổng lượt xem"
          icon={<Users size={18} />}
          tone="emerald"
        />
        <StatCard
          label="Clicks"
          value={totalClicks.toLocaleString("vi-VN")}
          detail={`CTR ${ctr}`}
          icon={<MousePointerClick size={18} />}
          tone="violet"
        />
        <StatCard
          label="Top source"
          value="Instagram"
          detail="940 views"
          icon={<TrendingUp size={18} />}
          tone="amber"
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <SoftCard className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="font-bold text-slate-950">Bio pages</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Danh sách profile đang quản lý.
              </p>
            </div>
            <button
              type="button"
              onClick={onCreate}
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-slate-950 px-3 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              <Plus size={15} />
              New
            </button>
          </div>

          {error ? (
            <div className="m-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
              {error}
            </div>
          ) : loading ? (
            <div className="space-y-3 p-5">
              {[1, 2, 3].map((row) => (
                <div key={row} className="h-20 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : bioPages.length === 0 ? (
            <div className="p-8 text-center">
              <Smartphone className="mx-auto size-10 text-slate-300" />
              <h3 className="mt-3 font-bold text-slate-950">Chưa có bio page</h3>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Tạo bio đầu tiên để có public profile /b/slug.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {bioPages.map((page) => (
                <BioPageRow key={page.id} page={page} />
              ))}
            </div>
          )}
        </SoftCard>

        <SoftCard className="p-5">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
              <Link2 size={20} />
            </span>
            <div>
              <h2 className="font-bold text-slate-950">Live preview</h2>
              <p className="text-sm font-semibold text-slate-500">
                {bioPages[0]?.publicUrl || "/b/your-bio"}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mx-auto max-w-52 rounded-[2rem] border-4 border-slate-300 bg-white p-4 text-center shadow-sm">
              <div className="mx-auto size-14 rounded-full bg-slate-900" />
              <h3 className="mt-3 font-bold text-slate-950">
                {bioPages[0]?.name || "Your bio"}
              </h3>
              <p className="text-xs font-semibold text-slate-500">
                {bioPages[0]?.title || "Creator tools"}
              </p>
              <div className="mt-4 space-y-2">
                {(bioPages[0]?.customLinks.length
                  ? bioPages[0].customLinks.map((link) => link.title)
                  : ["YouTube", "Preset pack", "Community"]
                ).slice(0, 3).map((item) => (
                  <div
                    key={item}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SoftCard>
      </section>
    </div>
  );
}

function BioPageRow({
  page,
}: {
  page: BioPageDto;
}) {
  const ctr = page.views > 0 ? `${((page.clicks / page.views) * 100).toFixed(1)}%` : "0%";

  return (
    <article className="flex flex-col gap-4 px-5 py-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-bold text-slate-950">{page.name}</h3>
          <Badge tone={page.status === "published" ? "emerald" : "slate"}>
            {page.status}
          </Badge>
        </div>
        <p className="mt-1 text-sm font-semibold text-slate-500">{page.publicUrl}</p>
      </div>

      <div className="grid grid-cols-3 gap-3 text-sm sm:min-w-64">
        <MiniMetric label="Views" value={page.views.toLocaleString("vi-VN")} />
        <MiniMetric label="Clicks" value={page.clicks.toLocaleString("vi-VN")} />
        <MiniMetric label="CTR" value={ctr} />
      </div>

      <div className="flex gap-1">
        <IconAction
          label="Copy"
          onClick={() => void navigator.clipboard.writeText(page.publicUrl)}
        >
          <Copy size={16} />
        </IconAction>
        <a
          href={page.publicUrl}
          target="_blank"
          rel="noreferrer"
          className="grid size-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-950"
          aria-label="Open"
        >
          <ExternalLink size={16} />
        </a>
      </div>
    </article>
  );
}

function BioAnalytics({ bioPages }: { bioPages: BioPageDto[] }) {
  const maxViews = Math.max(...channelRows.map((row) => row.views));
  const totalViews = bioPages.reduce((sum, page) => sum + page.views, 0);
  const totalClicks = bioPages.reduce((sum, page) => sum + page.clicks, 0);
  const visibleLinks = bioPages.reduce(
    (sum, page) =>
      sum + page.customLinks.filter((link) => !page.hiddenLinks.includes(link.id)).length,
    0,
  );
  const ctr = totalViews > 0 ? `${((totalClicks / totalViews) * 100).toFixed(1)}%` : "0%";

  return (
    <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total views" value={totalViews.toLocaleString("vi-VN")} detail="All bio pages" icon={<Users size={18} />} />
        <StatCard
          label="Total clicks"
          value={totalClicks.toLocaleString("vi-VN")}
          detail="Tracked public clicks"
          icon={<MousePointerClick size={18} />}
          tone="emerald"
        />
        <StatCard label="CTR" value={ctr} detail="Click / view" icon={<TrendingUp size={18} />} tone="violet" />
        <StatCard label="Active links" value={visibleLinks.toString()} detail="Visible custom links" icon={<Link2 size={18} />} tone="amber" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <SoftCard className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-bold text-slate-950">Traffic sources</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Views theo kênh trong 7 ngày gần nhất.
              </p>
            </div>
            <Badge tone="blue">7 days</Badge>
          </div>

          <div className="mt-6 space-y-4">
            {channelRows.map((row) => (
              <div key={row.source}>
                <div className="mb-2 flex items-center justify-between text-sm font-bold">
                  <span className="text-slate-700">{row.source}</span>
                  <span className="text-slate-500">{row.views.toLocaleString("vi-VN")}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${row.color}`}
                    style={{ width: `${(row.views / maxViews) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </SoftCard>

        <SoftCard className="p-5">
          <h2 className="font-bold text-slate-950">Top links</h2>
          <div className="mt-4 space-y-3">
            {(bioPages[0]?.customLinks.length
              ? bioPages[0].customLinks.map((link) => [link.title, "Live"] as const)
              : [
                  ["Preset Lightroom Pack", "312 clicks"],
                  ["YouTube channel", "184 clicks"],
                  ["Community Discord", "96 clicks"],
                  ["PayPal support", "42 clicks"],
                ]
            ).map(([title, value]) => (
              <div
                key={title}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3"
              >
                <span className="min-w-0 truncate text-sm font-bold text-slate-700">
                  {title}
                </span>
                <span className="shrink-0 text-xs font-bold text-slate-400">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </SoftCard>
      </section>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-0.5 font-bold text-slate-900">{value}</p>
    </div>
  );
}

function IconAction({
  label,
  children,
  onClick,
}: {
  label: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-9 cursor-pointer place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-950"
    >
      {children}
    </button>
  );
}
