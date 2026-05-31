import { CheckCircle2, Gift, Gem, Star, Trophy, Zap } from "lucide-react";

import {
  Badge,
  PageHeader,
  ProgressBar,
  SoftCard,
  StatCard,
  TableShell,
} from "@/components/dashboard/ui";

const tiers = [
  ["Đồng", "0 điểm", "bg-orange-100 text-orange-700"],
  ["Bạc", "10K điểm", "bg-slate-100 text-slate-700"],
  ["Vàng", "50K điểm", "bg-amber-100 text-amber-700"],
  ["Kim cương", "120K điểm", "bg-cyan-100 text-cyan-700"],
];

export function LoyaltyView() {
  return (
    <>
      <PageHeader
        eyebrow="Loyalty"
        title="Thân thiết"
        description="Gamification nhẹ giúp bạn theo dõi điểm thân thiết, nhiệm vụ và quyền lợi theo hạng thành viên."
      />

      <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <SoftCard className="overflow-hidden p-6">
          <div className="rounded-lg bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 p-6 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-white/65">
                  Hạng hiện tại
                </p>
                <h2 className="mt-2 text-3xl font-bold">Đồng Creator</h2>
                <p className="mt-2 text-sm font-semibold text-white/75">
                  Còn 6,000 điểm để lên Bạc.
                </p>
              </div>
              <Trophy size={36} className="text-white/85" />
            </div>
            <div className="mt-8">
              <div className="mb-2 flex justify-between text-sm font-bold text-white/78">
                <span>4,000 điểm</span>
                <span>10,000 điểm</span>
              </div>
              <ProgressBar value={40} tone="amber" />
            </div>
          </div>
        </SoftCard>

        <div className="grid gap-4">
          <StatCard
            label="Điểm hiện có"
            value="4,000"
            detail="+620 tuần này"
            icon={<Star size={20} />}
            tone="amber"
          />
          <StatCard
            label="Nhiệm vụ mở"
            value="6"
            detail="3 nhiệm vụ dễ"
            icon={<Gift size={20} />}
            tone="violet"
          />
        </div>
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-4 sm:grid-cols-2">
        {tiers.map(([tier, points, tone]) => (
          <SoftCard key={tier} className="p-5">
            <Gem className="text-blue-600" size={24} />
            <h3 className="mt-4 text-xl font-bold text-slate-950">{tier}</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">{points}</p>
            <span className={`mt-5 inline-flex rounded-full px-3 py-1 text-xs font-bold ${tone}`}>
              {tier === "Đồng" ? "Đang dùng" : "Sắp mở khóa"}
            </span>
          </SoftCard>
        ))}
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_420px]">
        <SoftCard className="p-5">
          <h3 className="text-lg font-bold text-slate-950">Nhiệm vụ nhận điểm</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {[
              ["Tạo 1 link mới", "+200 điểm"],
              ["Đạt 500 click", "+500 điểm"],
              ["Mời 1 creator", "+800 điểm"],
              ["Hoàn thiện hồ sơ", "+150 điểm"],
            ].map(([task, point]) => (
              <div key={task} className="rounded-lg bg-slate-50 p-4">
                <Zap size={18} className="text-emerald-500" />
                <p className="mt-3 font-bold text-slate-800">{task}</p>
                <p className="text-sm font-bold text-blue-600">{point}</p>
              </div>
            ))}
          </div>
        </SoftCard>

        <TableShell
          headers={["Ngày", "Hoạt động", "Điểm"]}
          rows={[
            ["31-05", "Click hợp lệ", "+120"],
            ["30-05", "Tạo link mới", "+200"],
            ["29-05", "Referral active", "+800"],
          ].map(([date, activity, point]) => (
            <tr key={`${date}-${activity}`}>
              <td className="px-5 py-4">{date}</td>
              <td className="px-5 py-4">{activity}</td>
              <td className="px-5 py-4">
                <Badge tone="emerald">
                  <CheckCircle2 size={13} className="mr-1" />
                  {point}
                </Badge>
              </td>
            </tr>
          ))}
        />
      </section>
    </>
  );
}
