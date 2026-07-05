"use client";
import { useEffect, useState } from "react";
import { Home, Link2, Plus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import SocialLinksGenerator from "@/app/create/demo";
import { LinkCard } from "@/components/dashboard/views/link-card";
import {
  AppButton,
  EmptyState,
  PageHeader,
  SoftCard,
  Toolbar,
} from "@/components/dashboard/ui";
import { getLinks, type LinkDto } from "@/lib/api-client";

type LinksTab = "overview" | "create" | "monetization";

const linksTabs: Array<{
  id: LinksTab;
  label: string;
  mobileLabel?: string;
  icon: LucideIcon;
}> = [
    { id: "overview", label: "Overview", icon: Home },
    { id: "create", label: "Create", icon: Plus },
    {
      id: "monetization",
      label: "Monetization",
      mobileLabel: "Links",
      icon: Link2,
    },
  ];
function LinksTabs({
  activeTab,
  onChange,
}: {
  activeTab: LinksTab;
  onChange: (tab: LinksTab) => void;
}) {
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

export function LinksView() {
  const [links, setLinks] = useState<LinkDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<LinksTab>("overview");
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
              : "Không tải được danh sách link.",
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
  }, []);

  return (
    <>
      <PageHeader
        eyebrow="Links management"
        title="Social links"
        description="Tạo và quản lý các liên kết rút gọn để theo dõi hiệu suất và tối ưu thu nhập."
      />

      <LinksTabs activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "overview" ? (
        <div className="space-y-5">
          {/* <Toolbar
            placeholder="Tìm chiến dịch, URL rút gọn..."
            filterTitle="Lọc liên kết"
            filterDescription="Chọn điều kiện để thu hẹp danh sách liên kết."
            filterFields={[
              {
                id: "status",
                label: "Trạng thái",
                type: "select",
                placeholder: "Tất cả trạng thái",
                options: [
                  { label: "Đang hoạt động", value: "active" },
                  { label: "Nháp", value: "draft" },
                  { label: "Tạm dừng", value: "paused" },
                ],
              },
              {
                id: "createdAt",
                label: "Ngày tạo",
                type: "date",
              },
              {
                id: "minClicks",
                label: "Click tối thiểu",
                type: "number",
                placeholder: "Ví dụ: 100",
              },
              {
                id: "highPerformance",
                label: "Chỉ hiện link hiệu suất cao",
                type: "checkbox",
                description: "Ưu tiên link có lượt click và chuyển đổi tốt.",
              },
            ]}
          /> */}

          {error ? (
            <EmptyState
              title="Không tải được liên kết"
              description={error}
              action={
                <AppButton>
                  <Plus size={16} />
                  Thử lại
                </AppButton>
              }
            />
          ) : loading ? (
            <div className="space-y-5">
              <Toolbar
                placeholder="Tìm chiến dịch, URL rút gọn..."
                filterTitle="Lọc liên kết"
                filterDescription="Chọn điều kiện để thu hẹp danh sách liên kết."
                filterFields={[
                  {
                    id: "status",
                    label: "Trạng thái",
                    type: "select",
                    placeholder: "Tất cả trạng thái",
                    options: [
                      { label: "Đang hoạt động", value: "active" },
                      { label: "Nháp", value: "draft" },
                      { label: "Tạm dừng", value: "paused" },
                    ],
                  },
                  {
                    id: "createdAt",
                    label: "Ngày tạo",
                    type: "date",
                  },
                  {
                    id: "minClicks",
                    label: "Click tối thiểu",
                    type: "number",
                    placeholder: "Ví dụ: 100",
                  },
                  {
                    id: "highPerformance",
                    label: "Chỉ hiện link hiệu suất cao",
                    type: "checkbox",
                    description:
                      "Ưu tiên link có lượt click và chuyển đổi tốt.",
                  },
                ]}
              />

              {error ? (
                <EmptyState
                  title="Không tải được liên kết"
                  description={error}
                  action={
                    <AppButton>
                      <Plus size={16} />
                      Thử lại
                    </AppButton>
                  }
                />
              ) : loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((row) => (
                    <div
                      key={row}
                      className="rounded-3xl border border-slate-200 bg-white p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-3">
                          <div className="h-7 w-40 animate-pulse rounded-lg bg-slate-100" />
                          <div className="h-5 w-96 animate-pulse rounded-lg bg-slate-100" />
                        </div>

                        <div className="flex gap-2">
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

                          <div className="h-11 w-52 animate-pulse rounded-xl bg-slate-100" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : links.length === 0 ? (
                <EmptyState
                  title="Chưa có liên kết nào"
                  description="Tạo link đầu tiên để bắt đầu đo click, chuyển đổi và doanh thu."
                  action={
                    <button
                      type="button"
                      onClick={() => setActiveTab("create")}
                      className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white shadow-[0_6px_16px_rgba(37,99,235,0.16)] transition hover:bg-blue-700"
                    >
                      <Plus size={16} />
                      Tạo liên kết mới
                    </button>
                  }
                />
              ) : (
                <section className="space-y-4">
                  <div className="space-y-4">
                    {links.map((link) => (
                      <LinkCard key={link.id} link={link} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          ) : links.length === 0 ? (
            <EmptyState
              title="Chưa có liên kết nào"
              description="Tạo link đầu tiên để bắt đầu đo click, chuyển đổi và doanh thu."
              action={
                <button
                  type="button"
                  onClick={() => setActiveTab("create")}
                  className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white shadow-[0_6px_16px_rgba(37,99,235,0.16)] transition hover:bg-blue-700"
                >
                  <Plus size={16} />
                  Tạo liên kết mới
                </button>
              }
            />
          ) : (
            <div className="space-y-5">
              <Toolbar
                placeholder="Tìm chiến dịch, URL rút gọn..."
                filterTitle="Lọc liên kết"
                filterDescription="Chọn điều kiện để thu hẹp danh sách liên kết."
                filterFields={[
                  {
                    id: "status",
                    label: "Trạng thái",
                    type: "select",
                    placeholder: "Tất cả trạng thái",
                    options: [
                      { label: "Đang hoạt động", value: "active" },
                      { label: "Nháp", value: "draft" },
                      { label: "Tạm dừng", value: "paused" },
                    ],
                  },
                  {
                    id: "createdAt",
                    label: "Ngày tạo",
                    type: "date",
                  },
                  {
                    id: "minClicks",
                    label: "Click tối thiểu",
                    type: "number",
                    placeholder: "Ví dụ: 100",
                  },
                  {
                    id: "highPerformance",
                    label: "Chỉ hiện link hiệu suất cao",
                    type: "checkbox",
                    description:
                      "Ưu tiên link có lượt click và chuyển đổi tốt.",
                  },
                ]}
              />

              {error ? (
                <EmptyState
                  title="Không tải được liên kết"
                  description={error}
                  action={
                    <AppButton>
                      <Plus size={16} />
                      Thử lại
                    </AppButton>
                  }
                />
              ) : loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((row) => (
                    <div
                      key={row}
                      className="rounded-3xl border border-slate-200 bg-white p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-3">
                          <div className="h-7 w-40 animate-pulse rounded-lg bg-slate-100" />
                          <div className="h-5 w-96 animate-pulse rounded-lg bg-slate-100" />
                        </div>

                        <div className="flex gap-2">
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

                          <div className="h-11 w-52 animate-pulse rounded-xl bg-slate-100" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : links.length === 0 ? (
                <EmptyState
                  title="Chưa có liên kết nào"
                  description="Tạo link đầu tiên để bắt đầu đo click, chuyển đổi và doanh thu."
                  action={
                    <button
                      type="button"
                      onClick={() => setActiveTab("create")}
                      className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white shadow-[0_6px_16px_rgba(37,99,235,0.16)] transition hover:bg-blue-700"
                    >
                      <Plus size={16} />
                      Tạo liên kết mới
                    </button>
                  }
                />
              ) : (
                <section className="space-y-4">
                  <div className="space-y-4">
                    {links.map((link) => (
                      <LinkCard key={link.id} link={link} />
                    ))}
                  </div>
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
        <div className="space-y-5">No section yet, coming soon! 🚀</div>
      ) : null}
    </>
  );
}
