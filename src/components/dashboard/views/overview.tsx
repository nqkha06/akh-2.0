import {
  ArrowRight,
  BarChart3,
  Crown,
  Link2,
  MousePointerClick,
  Trophy,
  Users,
  Wallet,
  Zap,
} from "lucide-react";

import {
  AppButton,
  Badge,
  PageHeader,
  ProgressBar,
  SoftCard,
  StatCard,
} from "@/components/dashboard/ui";
import { CreateLinkDialog } from "@/components/create-link-dialog";

const days = Array.from({ length: 18 }, (_, index) => `${index + 1}`);

function RevenueChart() {
  return (
    <SoftCard className="overflow-hidden p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-950">
            Doanh thu / lượt click
          </h3>
          <p className="text-sm font-semibold text-slate-500">
            Tăng trưởng 18 ngày gần nhất
          </p>
        </div>
        <Badge tone="emerald">+18.4%</Badge>
      </div>
      <div className="overflow-x-auto">
        <svg
          viewBox="0 0 980 300"
          className="h-[300px] min-w-[820px] w-full"
          role="img"
          aria-label="Biểu đồ doanh thu và lượt click"
        >
          {[0, 1, 2, 3, 4].map((tick) => {
            const y = 250 - tick * 52;
            return (
              <line
                key={tick}
                x1="46"
                x2="940"
                y1={y}
                y2={y}
                stroke="#e2e8f0"
                strokeDasharray="6 8"
              />
            );
          })}
          <path
            d="M50 240 C110 230 130 210 180 212 C240 215 245 154 306 160 C365 166 370 118 428 118 C504 118 512 72 580 86 C646 100 650 132 716 124 C780 116 794 66 860 74 C900 78 918 58 940 52"
            fill="none"
            stroke="#2563eb"
            strokeLinecap="round"
            strokeWidth="5"
          />
          <path
            d="M50 254 C112 246 144 238 190 230 C242 222 266 198 318 206 C382 214 424 184 480 174 C546 164 590 134 648 148 C716 164 742 184 798 170 C858 156 894 136 940 116"
            fill="none"
            stroke="#10b981"
            strokeLinecap="round"
            strokeWidth="5"
            opacity="0.78"
          />
          <path
            d="M50 240 C110 230 130 210 180 212 C240 215 245 154 306 160 C365 166 370 118 428 118 C504 118 512 72 580 86 C646 100 650 132 716 124 C780 116 794 66 860 74 C900 78 918 58 940 52 L940 270 L50 270 Z"
            fill="url(#blueFade)"
          />
          <defs>
            <linearGradient id="blueFade" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
            </linearGradient>
          </defs>
          {days.map((day, index) => (
            <text
              key={day}
              x={54 + index * 52}
              y="292"
              textAnchor="middle"
              fontSize="12"
              fill="#94a3b8"
            >
              {day}
            </text>
          ))}
        </svg>
      </div>
    </SoftCard>
  );
}

function CurrentLevelCard() {
  return (
    <SoftCard className="overflow-hidden p-5">
      <div className="rounded-lg bg-gradient-to-br from-slate-950 to-indigo-950 p-5 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/50">
              Cấp độ hiện tại
            </p>
            <h3 className="mt-2 text-2xl font-bold">Silver Partner</h3>
          </div>
          <Crown className="text-amber-300" size={26} />
        </div>
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-sm font-bold text-white/70">
            <span>6,800 / 10,000 điểm</span>
            <span>68%</span>
          </div>
          <ProgressBar value={68} tone="emerald" />
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {["Tăng CPM thêm 12%", "Ưu tiên duyệt campaign", "Huy hiệu nổi bật"].map(
          (item) => (
            <div
              key={item}
              className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 text-sm font-bold text-slate-600"
            >
              <Zap size={16} className="text-emerald-500" />
              {item}
            </div>
          ),
        )}
      </div>
    </SoftCard>
  );
}

export function OverviewView() {
  return (
    <>
      <PageHeader
        eyebrow="Tổng quan"
        title="Chào mừng trở lại"
        description="Theo dõi thu nhập, lượt click, giới thiệu và các hành động giúp tăng doanh thu trong một màn hình vận hành."
        action={<CreateLinkDialog />}
      />

      <section className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
        <StatCard
          label="Tổng thu nhập"
          value="18,420,000đ"
          detail="+12.4% tháng này"
          icon={<Wallet size={20} />}
          tone="blue"
        />
        <StatCard
          label="Số lượt click"
          value="128.4K"
          detail="+8.2% tuần này"
          icon={<MousePointerClick size={20} />}
          tone="emerald"
        />
        <StatCard
          label="Số lượt giới thiệu"
          value="642"
          detail="+42 người mới"
          icon={<Users size={20} />}
          tone="violet"
        />
        <StatCard
          label="Có thể rút"
          value="222,105đ"
          detail="Đủ điều kiện rút"
          icon={<Wallet size={20} />}
          tone="amber"
        />
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_360px]">
        <RevenueChart />
        <CurrentLevelCard />
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_360px]">
        <SoftCard className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-950">Quick actions</h3>
            <Badge tone="blue">Tăng tốc</Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <button className="group flex min-h-24 items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 text-left shadow-[0_8px_20px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:border-blue-200/80">
              <span className="grid size-11 place-items-center rounded-2xl bg-blue-50 text-blue-600">
                <Link2 size={20} />
              </span>
              <span>
                <span className="block text-sm font-bold text-slate-900">Tạo liên kết</span>
                <span className="text-xs font-semibold text-slate-500">Tăng nguồn thu</span>
              </span>
            </button>
            <button className="group flex min-h-24 items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 text-left shadow-[0_8px_20px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:border-emerald-200/80">
              <span className="grid size-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                <Wallet size={20} />
              </span>
              <span>
                <span className="block text-sm font-bold text-slate-900">Rút tiền</span>
                <span className="text-xs font-semibold text-slate-500">Gửi yêu cầu nhanh</span>
              </span>
            </button>
            <button className="group flex min-h-24 items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 text-left shadow-[0_8px_20px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:border-violet-200/80">
              <span className="grid size-11 place-items-center rounded-2xl bg-violet-50 text-violet-600">
                <Trophy size={20} />
              </span>
              <span>
                <span className="block text-sm font-bold text-slate-900">Bảng xếp hạng</span>
                <span className="text-xs font-semibold text-slate-500">Theo dõi thứ hạng</span>
              </span>
            </button>
          </div>
        </SoftCard>

        <SoftCard className="p-5">
          <h3 className="text-lg font-bold text-slate-950">Hành động ưu tiên</h3>
          <div className="mt-4 space-y-3">
            {[
              ["Bật A/B test cho 2 link top", "Tối ưu tỷ lệ unlock"],
              ["Thêm CTA cho link có CTR thấp", "Tăng click mới"],
              ["Gắn badge mới cho chiến dịch", "Tăng độ uy tín"],
            ].map(([title, desc]) => (
              <div
                key={title}
                className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-bold text-slate-800">{title}</p>
                  <p className="text-xs font-semibold text-slate-500">{desc}</p>
                </div>
                <AppButton variant="ghost" className="h-9 px-3">
                  Xem
                </AppButton>
              </div>
            ))}
          </div>
        </SoftCard>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_360px]">
        <SoftCard className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-950">Hoạt động gần đây</h3>
            <Badge tone="slate">Live</Badge>
          </div>
          <div className="space-y-3">
            {[
              ["Link Preset Pro có 320 click mới", "2 phút trước", "blue"],
              ["Bạn nhận 154đ doanh thu mới", "16 phút trước", "emerald"],
              ["Minh Studio đăng ký qua mã giới thiệu", "1 giờ trước", "violet"],
              ["Yêu cầu rút tiền đã được duyệt", "Hôm qua", "amber"],
            ].map(([title, time, tone]) => (
              <div
                key={title}
                className="flex items-center gap-3 rounded-lg border border-slate-100 bg-white p-3"
              >
                <span
                  className={`grid size-9 place-items-center rounded-xl ${
                    tone === "blue"
                      ? "bg-blue-50 text-blue-600"
                      : tone === "emerald"
                        ? "bg-emerald-50 text-emerald-600"
                        : tone === "violet"
                          ? "bg-violet-50 text-violet-600"
                          : "bg-amber-50 text-amber-600"
                  }`}
                >
                  <BarChart3 size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-800">
                    {title}
                  </p>
                  <p className="text-xs font-semibold text-slate-400">{time}</p>
                </div>
              </div>
            ))}
          </div>
        </SoftCard>

        <SoftCard className="p-5">
          <h3 className="text-lg font-bold text-slate-950">
            Nhiệm vụ tăng thu nhập
          </h3>
          <div className="mt-4 space-y-3">
            {[
              ["Tạo thêm 2 link mới", "Tăng phân phối nội dung"],
              ["Thêm cover cho link top 3", "Tăng tỉ lệ unlock"],
              ["Mời 5 creator mới", "Nhận bonus giới thiệu"],
            ].map(([title, desc]) => (
              <button
                key={title}
                className="flex w-full cursor-pointer items-center justify-between rounded-lg bg-slate-50 p-3 text-left transition hover:bg-blue-50"
              >
                <span>
                  <span className="block text-sm font-bold text-slate-800">
                    {title}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {desc}
                  </span>
                </span>
                <ArrowRight size={16} className="text-slate-400" />
              </button>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <AppButton variant="secondary" className="flex-1">
              <Trophy size={16} />
              Xếp hạng
            </AppButton>
            <AppButton variant="secondary" className="flex-1">
              <Link2 size={16} />
              Link mới
            </AppButton>
          </div>
        </SoftCard>
      </section>
    </>
  );
}
