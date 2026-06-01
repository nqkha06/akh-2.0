import {
  ArrowRight,
  BarChart3,
  Crown,
  FileImage,
  Link2,
  MousePointerClick,
  Trophy,
  Users,
  Wallet,
  Zap,
} from "lucide-react";

import {
  Badge,
  PageHeader,
  ProgressBar,
  SoftCard,
  StatCard,
} from "@/components/dashboard/ui";

const days = Array.from({ length: 18 }, (_, index) => `${index + 1}`);

const topLinks = [
  { title: "Preset Pro Pack", clicks: "18.2K", revenue: "4,820,000đ" },
  { title: "Video template launch", clicks: "12.6K", revenue: "3,140,000đ" },
  { title: "Creator resource hub", clicks: "8.9K", revenue: "2,410,000đ" },
  { title: "File unlock campaign", clicks: "6.4K", revenue: "1,920,000đ" },
];

const actionSuggestions = [
  {
    title: "Tạo link mới",
    description: "Dùng nội dung đang có CTR cao để mở rộng traffic.",
    icon: Link2,
    tone: "bg-blue-50 text-blue-700",
  },
  {
    title: "Xem file hiệu quả",
    description: "Kiểm tra file đang kéo nhiều lượt unlock nhất.",
    icon: FileImage,
    tone: "bg-emerald-50 text-emerald-700",
  },
  {
    title: "Tối ưu chiến dịch",
    description: "Cập nhật CTA cho các link có chuyển đổi thấp.",
    icon: Trophy,
    tone: "bg-violet-50 text-violet-700",
  },
];

const recentActivities = [
  { title: "Preset Pro Pack có 320 click mới", time: "2 phút trước", tone: "bg-blue-50 text-blue-700" },
  { title: "Bạn nhận 154đ doanh thu mới", time: "16 phút trước", tone: "bg-emerald-50 text-emerald-700" },
  { title: "Minh Studio đăng ký qua mã giới thiệu", time: "1 giờ trước", tone: "bg-violet-50 text-violet-700" },
  { title: "Yêu cầu rút tiền đã được duyệt", time: "Hôm qua", tone: "bg-amber-50 text-amber-700" },
];

function RevenueChart() {
  return (
    <SoftCard className="overflow-hidden p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-950">
            Doanh thu / lượt click
          </h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            So sánh doanh thu và lượt click trong 18 ngày gần nhất.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="blue">Doanh thu</Badge>
          <Badge tone="emerald">Click</Badge>
        </div>
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
            d="M50 240 C110 230 130 210 180 212 C240 215 245 154 306 160 C365 166 370 118 428 118 C504 118 512 72 580 86 C646 100 650 132 716 124 C780 116 794 66 860 74 C900 78 918 58 940 52 L940 270 L50 270 Z"
            fill="#dbeafe"
            opacity="0.65"
          />
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
          />
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
    <SoftCard className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
            Cấp độ hiện tại
          </p>
          <h3 className="mt-2 text-2xl font-bold text-slate-950">
            Silver Partner
          </h3>
        </div>
        <span className="grid size-10 place-items-center rounded-lg bg-amber-50 text-amber-700 ring-1 ring-amber-100">
          <Crown size={22} />
        </span>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-sm font-bold text-slate-600">
          <span>6,800 / 10,000 điểm</span>
          <span>68%</span>
        </div>
        <ProgressBar value={68} tone="blue" />
      </div>

      <div className="mt-4 space-y-2.5">
        {["Tăng CPM thêm 12%", "Ưu tiên duyệt campaign", "Huy hiệu nổi bật"].map(
          (item) => (
            <div
              key={item}
              className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-600"
            >
              <Zap size={15} className="text-blue-600" />
              {item}
            </div>
          ),
        )}
      </div>
    </SoftCard>
  );
}

function TopLinksCard() {
  return (
    <SoftCard className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-950">Link hiệu quả nhất</h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Top link theo lượt click và doanh thu.
          </p>
        </div>
        <Badge tone="blue">Top 4</Badge>
      </div>

      <div className="space-y-2">
        {topLinks.map((link, index) => (
          <div
            key={link.title}
            className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg border border-slate-100 bg-white px-3 py-3"
          >
            <span className="grid size-8 place-items-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
              {index + 1}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-800">{link.title}</p>
              <p className="text-xs font-semibold text-slate-500">{link.clicks} click</p>
            </div>
            <p className="text-right text-sm font-bold text-slate-900">
              {link.revenue}
            </p>
          </div>
        ))}
      </div>
    </SoftCard>
  );
}

function ActionSuggestionsCard() {
  return (
    <SoftCard className="p-5">
      <h3 className="text-lg font-bold text-slate-950">Gợi ý hành động</h3>
      <div className="mt-4 space-y-3">
        {actionSuggestions.map((item) => (
          <button
            key={item.title}
            className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-slate-100 bg-white p-3 text-left transition hover:border-blue-200 hover:bg-blue-50"
          >
            <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${item.tone}`}>
              <item.icon size={17} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-slate-800">
                {item.title}
              </span>
              <span className="line-clamp-2 text-xs font-semibold text-slate-500">
                {item.description}
              </span>
            </span>
            <ArrowRight size={16} className="text-slate-400" />
          </button>
        ))}
      </div>
    </SoftCard>
  );
}

function RecentActivityCard() {
  return (
    <SoftCard className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-950">Hoạt động gần đây</h3>
        <Badge tone="slate">Live</Badge>
      </div>
      <div className="space-y-3">
        {recentActivities.map((activity) => (
          <div
            key={activity.title}
            className="flex items-center gap-3 rounded-lg border border-slate-100 bg-white p-3"
          >
            <span className={`grid size-9 place-items-center rounded-lg ${activity.tone}`}>
              <BarChart3 size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-800">
                {activity.title}
              </p>
              <p className="text-xs font-semibold text-slate-400">
                {activity.time}
              </p>
            </div>
          </div>
        ))}
      </div>
    </SoftCard>
  );
}

export function OverviewView() {
  return (
    <>
      <PageHeader
        eyebrow="Hiệu suất"
        title="Tổng quan hiệu suất"
        description="Theo dõi thu nhập, lượt click và giới thiệu trong 18 ngày gần nhất."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tổng thu nhập"
          value="18,420,000đ"
          detail="+12.4% tháng này"
          icon={<Wallet size={18} />}
          tone="blue"
        />
        <StatCard
          label="Số lượt click"
          value="128.4K"
          detail="+8.2% tuần này"
          icon={<MousePointerClick size={18} />}
          tone="emerald"
        />
        <StatCard
          label="Số lượt giới thiệu"
          value="642"
          detail="+42 người mới"
          icon={<Users size={18} />}
          tone="violet"
        />
        <StatCard
          label="Có thể rút"
          value="222,105đ"
          detail="Đủ điều kiện rút"
          icon={<Wallet size={18} />}
          tone="amber"
        />
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_340px]">
        <RevenueChart />
        <CurrentLevelCard />
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_340px]">
        <TopLinksCard />
        <ActionSuggestionsCard />
      </section>

      <section className="mt-5">
        <RecentActivityCard />
      </section>
    </>
  );
}
