import { Bug, CalendarDays, Rocket, Sparkles, Wand2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge, PageHeader, SoftCard } from "@/components/dashboard/ui";

const updates = [
  {
    type: "New",
    title: "Modal tạo link SUB to unlock",
    desc: "Tạo link, thêm action mạng xã hội, preview unlock page trong một flow.",
    date: "31-05-2026",
    icon: Rocket,
    tone: "blue" as const,
  },
  {
    type: "Improved",
    title: "Dashboard affiliate mới",
    desc: "Nâng cấp layout, card thống kê, bảng dữ liệu và sidebar grouping.",
    date: "30-05-2026",
    icon: Wand2,
    tone: "violet" as const,
  },
  {
    type: "Fixed",
    title: "Tối ưu trạng thái rút tiền",
    desc: "Làm rõ trạng thái thành công, đang xử lý và từ chối.",
    date: "28-05-2026",
    icon: Bug,
    tone: "emerald" as const,
  },
];

export function NewView() {
  const t = useTranslations("SimplePages.new");

  return (
    <>
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
      />

      <SoftCard className="mb-5 overflow-hidden p-6">
        <div className="grid gap-5 rounded-lg border border-blue-100 bg-blue-50 p-6 md:grid-cols-[1fr_260px] md:items-center">
          <div>
            <Badge tone="emerald">Mới nhất</Badge>
            <h2 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight text-slate-950">
              Bộ giao diện Light UI premium cho toàn bộ affiliate dashboard.
            </h2>
            <p className="mt-3 max-w-xl text-sm font-semibold leading-6 text-slate-600">
              Sidebar grouping, header search, card depth, table nâng cấp và các
              route riêng cho từng tính năng.
            </p>
          </div>
          <div className="grid aspect-square place-items-center rounded-lg bg-white text-blue-700 ring-1 ring-blue-100">
            <Sparkles size={72} />
          </div>
        </div>
      </SoftCard>

      <section className="grid gap-4 lg:grid-cols-3">
        {updates.map((update) => (
          <SoftCard key={update.title} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <span className="grid size-12 place-items-center rounded-lg bg-slate-100 text-blue-600">
                <update.icon size={22} />
              </span>
              <Badge tone={update.tone}>{update.type}</Badge>
            </div>
            <h3 className="mt-5 text-lg font-bold text-slate-950">
              {update.title}
            </h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
              {update.desc}
            </p>
            <p className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-slate-400">
              <CalendarDays size={14} />
              {update.date}
            </p>
          </SoftCard>
        ))}
      </section>
    </>
  );
}
