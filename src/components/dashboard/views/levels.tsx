import { CheckCircle2, Crown, LockKeyhole, Rocket, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  Badge,
  PageHeader,
  ProgressBar,
  SoftCard,
  StatCard,
  TableShell,
} from "@/components/dashboard/ui";
import { levelRows } from "@/lib/dashboard-data";

const tiers = [
  {
    name: "Starter",
    commission: "8%",
    condition: "0 - 5K click",
    unlocked: true,
    benefits: ["CPM cơ bản", "Duyệt link tiêu chuẩn"],
  },
  {
    name: "Silver",
    commission: "12%",
    condition: "5K - 20K click",
    unlocked: true,
    benefits: ["Tăng CPM", "Ưu tiên campaign"],
  },
  {
    name: "Gold",
    commission: "18%",
    condition: "20K - 80K click",
    unlocked: false,
    benefits: ["Bonus giới thiệu", "Huy hiệu nổi bật"],
  },
  {
    name: "Diamond",
    commission: "25%",
    condition: "80K+ click",
    unlocked: false,
    benefits: ["Tư vấn riêng", "Campaign độc quyền"],
  },
];

export function LevelsView() {
  const t = useTranslations("SimplePages.levels");

  return (
    <>
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
      />

      <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <SoftCard className="overflow-hidden p-6">
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-blue-700">
                  Cấp độ hiện tại
                </p>
                <h2 className="mt-2 text-3xl font-bold text-slate-950">Silver Partner</h2>
                <p className="mt-2 text-sm font-semibold text-slate-600">
                  Cần thêm 3,200 điểm để mở khóa Gold.
                </p>
              </div>
              <Crown size={34} className="text-amber-600" />
            </div>
            <div className="mt-8">
              <div className="mb-2 flex items-center justify-between text-sm font-bold text-slate-600">
                <span>6,800 điểm</span>
                <span>10,000 điểm</span>
              </div>
              <ProgressBar value={68} tone="emerald" />
            </div>
          </div>
        </SoftCard>

        <div className="grid gap-4">
          <StatCard
            label="Hoa hồng hiện tại"
            value="12%"
            detail="+4% so với Starter"
            icon={<TrendingUp size={20} />}
            tone="emerald"
          />
          <StatCard
            label="Campaign đã duyệt"
            value="42"
            detail="98.2% tỉ lệ duyệt"
            icon={<CheckCircle2 size={20} />}
            tone="blue"
          />
        </div>
      </section>

      <section className="mt-5 grid gap-4 xl:grid-cols-4 md:grid-cols-2">
        {tiers.map((tier) => (
          <SoftCard key={tier.name} className="p-5">
            <div className="flex items-start justify-between">
              <span className="grid size-11 place-items-center rounded-lg bg-slate-100 text-slate-600 ring-1 ring-slate-200">
                {tier.unlocked ? <Rocket size={20} /> : <LockKeyhole size={20} />}
              </span>
              <Badge tone={tier.unlocked ? "emerald" : "slate"}>
                {tier.unlocked ? "Đã mở khóa" : "Chưa mở khóa"}
              </Badge>
            </div>
            <h3 className="mt-5 text-xl font-bold text-slate-950">{tier.name}</h3>
            <p className="mt-1 text-3xl font-bold text-blue-600">
              {tier.commission}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {tier.condition}
            </p>
            <div className="mt-4 space-y-2">
              {tier.benefits.map((benefit) => (
                <div
                  key={benefit}
                  className="flex items-center gap-2 text-sm font-semibold text-slate-600"
                >
                  <CheckCircle2 size={15} className="text-emerald-500" />
                  {benefit}
                </div>
              ))}
            </div>
          </SoftCard>
        ))}
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_420px]">
        <TableShell
          headers={["Cấp độ", "CPM", "Điều kiện", "Tỉ lệ", ""]}
          rows={levelRows.map((row) => (
            <tr key={row.name} className="transition hover:bg-blue-50/35">
              <td className="px-5 py-4">{row.name}</td>
              <td className="px-5 py-4">{row.cpm}</td>
              <td className="px-5 py-4">{row.condition}</td>
              <td className="px-5 py-4">{row.share}</td>
              <td className="px-5 py-4 text-right">
                <button className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-bold text-white">
                  Chỉnh sửa
                </button>
              </td>
            </tr>
          ))}
        />

        <SoftCard className="p-5">
          <h3 className="text-lg font-bold text-slate-950">Roadmap thăng cấp</h3>
          <div className="mt-5 space-y-4">
            {["Tạo 5 link hiệu suất cao", "Đạt 10K click hợp lệ", "Duy trì tỉ lệ unlock trên 12%"].map(
              (item, index) => (
                <div key={item} className="flex gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-blue-50 text-sm font-bold text-blue-700">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-bold text-slate-800">{item}</p>
                    <p className="text-sm font-semibold text-slate-500">
                      Gợi ý hành động để lên cấp nhanh hơn.
                    </p>
                  </div>
                </div>
              ),
            )}
          </div>
        </SoftCard>
      </section>
    </>
  );
}
