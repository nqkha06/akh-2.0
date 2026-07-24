import type { OverviewData, OverviewDateRange } from "./types";

const performance30Days = [
  { label: "01/06", visits: 612, unlocks: 206, conversion: 33.7 },
  { label: "04/06", visits: 754, unlocks: 252, conversion: 33.4 },
  { label: "07/06", visits: 690, unlocks: 271, conversion: 39.3 },
  { label: "10/06", visits: 982, unlocks: 348, conversion: 35.4 },
  { label: "13/06", visits: 864, unlocks: 342, conversion: 39.6 },
  { label: "16/06", visits: 1128, unlocks: 451, conversion: 40 },
  { label: "19/06", visits: 1064, unlocks: 412, conversion: 38.7 },
  { label: "22/06", visits: 1320, unlocks: 527, conversion: 39.9 },
  { label: "25/06", visits: 1216, unlocks: 458, conversion: 37.7 },
  { label: "28/06", visits: 1490, unlocks: 598, conversion: 40.1 },
  { label: "30/06", visits: 1378, unlocks: 536, conversion: 38.9 },
];

const rangeMultiplier: Record<OverviewDateRange, number> = {
  "7d": 0.31,
  "30d": 1,
  "90d": 2.74,
  custom: 0.68,
};

const rangePoints: Record<OverviewDateRange, number> = {
  "7d": 7,
  "30d": performance30Days.length,
  "90d": performance30Days.length,
  custom: 9,
};

export function getOverviewMockData(range: OverviewDateRange): OverviewData {
  const multiplier = rangeMultiplier[range];
  const points = rangePoints[range];
  const performance = performance30Days.slice(-points).map((item, index) => ({
    ...item,
    label: range === "90d" ? `Tuần ${index + 1}` : item.label,
    visits: Math.round(item.visits * (range === "90d" ? 2.18 : multiplier)),
    unlocks: Math.round(item.unlocks * (range === "90d" ? 2.18 : multiplier)),
  }));

  return {
    metrics: [
      {
        id: "visits",
        label: "Lượt truy cập",
        value: Math.round(24_802 * multiplier),
        format: "number",
        change: 12.4,
        trend: "up",
        hint: "Tổng số lần các trang nội dung được mở trong kỳ đã chọn.",
        sparkline: [24, 31, 28, 42, 39, 51, 48, 63],
      },
      {
        id: "unlocks",
        label: "Lượt mở khóa",
        value: Math.round(9_401 * multiplier),
        format: "number",
        change: 8.7,
        trend: "up",
        hint: "Số phiên hoàn tất yêu cầu và mở được nội dung.",
        sparkline: [18, 22, 27, 25, 36, 39, 41, 47],
      },
      {
        id: "conversion",
        label: "Tỷ lệ chuyển đổi",
        value: 37.9,
        format: "percent",
        change: 2.1,
        trend: "up",
        hint: "Tỷ lệ lượt mở khóa trên tổng lượt truy cập.",
        sparkline: [31, 34, 33, 35, 36, 35, 38, 38],
      },
      {
        id: "revenue",
        label: "Doanh thu",
        value: Math.round(10_450_000 * multiplier),
        format: "currency",
        currency: "VND",
        change: 3.6,
        trend: "down",
        hint: "Doanh thu được ghi nhận từ nội dung trong kỳ đã chọn.",
        sparkline: [52, 49, 47, 50, 44, 43, 41, 39],
      },
    ],
    performance,
    performanceSummary: {
      totalVisits: Math.round(24_802 * multiplier),
      dailyAverage: Math.round(827 * (range === "90d" ? 0.98 : multiplier)),
      peakDay: range === "90d" ? "Tuần 10" : "28/06",
    },
    funnel: [
      { id: "visit", label: "Truy cập trang", value: Math.round(24_802 * multiplier) },
      {
        id: "start",
        label: "Bắt đầu hành động",
        value: Math.round(14_210 * multiplier),
        rateFromPrevious: 57.3,
      },
      {
        id: "complete",
        label: "Hoàn tất hành động",
        value: Math.round(10_184 * multiplier),
        rateFromPrevious: 71.7,
      },
      {
        id: "unlock",
        label: "Mở khóa nội dung",
        value: Math.round(9_401 * multiplier),
        rateFromPrevious: 92.3,
      },
    ],
    topContent: [
      { id: "preset-lightroom", name: "Preset Lightroom", href: "/member/links#preset-lightroom", type: "Unlock link", status: "active", visits: Math.round(8_420 * multiplier), unlocks: Math.round(3_578 * multiplier), conversion: 42.5, revenue: Math.round(4_820_000 * multiplier), revenueCurrency: "VND" },
      { id: "creator-hub", name: "Creator Resource Hub", href: "/member/bio", type: "Link-in-bio", status: "active", visits: Math.round(6_160 * multiplier), unlocks: Math.round(2_218 * multiplier), conversion: 36, revenue: Math.round(2_410_000 * multiplier), revenueCurrency: "VND" },
      { id: "discord-unlock", name: "Discord Unlock", href: "/member/links#discord-unlock", type: "Social link", status: "active", visits: Math.round(4_892 * multiplier), unlocks: Math.round(2_054 * multiplier), conversion: 42, revenue: Math.round(1_920_000 * multiplier), revenueCurrency: "VND" },
      { id: "video-template", name: "Video Template Launch", href: "/member/files", type: "File", status: "paused", visits: Math.round(3_870 * multiplier), unlocks: Math.round(1_018 * multiplier), conversion: 26.3, revenue: Math.round(1_300_000 * multiplier), revenueCurrency: "VND" },
      { id: "editing-guide", name: "Editing Guide 2026", href: "/member/links#editing-guide", type: "Unlock link", status: "draft", visits: Math.round(1_460 * multiplier), unlocks: Math.round(533 * multiplier), conversion: 36.5, revenue: 0, revenueCurrency: "VND" },
    ],
    recentActivity: [
      { id: "a1", kind: "unlock", content: "Link Preset Lightroom nhận được 128 lượt mở khóa", time: "2 phút trước", href: "/member/links#preset-lightroom" },
      { id: "a2", kind: "published", content: "Bạn đã xuất bản trang Link-in-bio mới", time: "36 phút trước", href: "/member/bio" },
      { id: "a3", kind: "payment", content: "Khoản thanh toán đã được xử lý", amount: 1_200_000, currency: "VND", time: "2 giờ trước", href: "/member/withdraw" },
      { id: "a4", kind: "milestone", content: "Discord Unlock đạt tỷ lệ chuyển đổi 42%", time: "Hôm qua", href: "/member/links#discord-unlock" },
    ],
    quickActions: [
      { id: "social", label: "Tạo social link", description: "Yêu cầu người xem hoàn tất hành động xã hội.", href: "/member/create?type=social", kind: "social", shortcut: "S" },
      { id: "file", label: "Tải file lên", description: "Chia sẻ tài nguyên với luồng mở khóa.", href: "/member/files", kind: "file", shortcut: "F" },
      { id: "bio", label: "Tạo link-in-bio", description: "Gom các điểm đến vào một trang cá nhân.", href: "/member/bio", kind: "bio", shortcut: "B" },
      { id: "unlock", label: "Tạo unlock link", description: "Bảo vệ đích đến bằng các bước hoàn thành.", href: "/member/create?type=unlock", kind: "unlock", shortcut: "U" },
    ],
  };
}
