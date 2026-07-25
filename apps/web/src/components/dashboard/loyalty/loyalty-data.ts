import {
  Gem,
  ShieldCheck,
  Sparkles,
  Trophy,
  type LucideIcon,
} from "lucide-react";

export type TierStatus = "current" | "next" | "locked";

export type LoyaltyTier = {
  id: "started" | "bronze" | "gold" | "diamond";
  name: string;
  requirement: string;
  benefits: readonly string[];
  icon: LucideIcon;
};

export const tiers = [
  {
    id: "started",
    name: "Khởi đầu",
    requirement: "0 lượt xem",
    benefits: [
      "Tích lũy lượt xem hợp lệ",
      "Theo dõi lịch sử 7 ngày",
      "Xuất QR code mặc định",
    ],
    icon: Sparkles,
  },
  {
    id: "bronze",
    name: "Đồng",
    requirement: "1.000 lượt xem",
    benefits: [
      "Thưởng CPM +1%",
      "Lịch sử phân tích 30 ngày",
      "5 custom slug mỗi tháng",
      "Thông báo khi đạt mốc lượt xem",
    ],
    icon: ShieldCheck,
  },
  {
    id: "gold",
    name: "Vàng",
    requirement: "5.000 lượt xem",
    benefits: [
      "Thưởng CPM +3%",
      "Lịch sử phân tích 90 ngày",
      "Lập lịch bật hoặc tắt link",
      "Xuất báo cáo CSV",
      "Tăng dung lượng lưu trữ file",
    ],
    icon: Trophy,
  },
  {
    id: "diamond",
    name: "Kim cương",
    requirement: "10.000 lượt xem",
    benefits: [
      "Thưởng CPM +5%",
      "Tăng giới hạn custom slug",
      "Tùy chỉnh QR code",
      "Giảm ngưỡng rút tiền",
      "Hỗ trợ ưu tiên",
    ],
    icon: Gem,
  },
] as const satisfies readonly LoyaltyTier[];

export const viewHistory = [
  { date: "20 thg 7, 2026", dailyViews: "0", rollingViews: "1" },
  { date: "21 thg 7, 2026", dailyViews: "0", rollingViews: "1" },
  { date: "22 thg 7, 2026", dailyViews: "0", rollingViews: "1" },
  { date: "23 thg 7, 2026", dailyViews: "0", rollingViews: "1" },
  { date: "24 thg 7, 2026", dailyViews: "0", rollingViews: "1" },
  { date: "25 thg 7, 2026", dailyViews: "0", rollingViews: "1" },
  { date: "26 thg 7, 2026", dailyViews: null, rollingViews: null },
] as const;

export type ViewHistoryRow = (typeof viewHistory)[number];

export const currentViews = 1;
export const nextTierTarget = 1_000;
export const currentTierIndex = 0;
export const nextTierIndex = 1;
export const currentTier = tiers[currentTierIndex];
export const nextTier = tiers[nextTierIndex];

export const progress = Math.min(
  100,
  Math.round((currentViews / nextTierTarget) * 100),
);

export const remainingViews = Math.max(0, nextTierTarget - currentViews);

export function getTierStatus(index: number): TierStatus {
  if (index === currentTierIndex) {
    return "current";
  }

  if (index === nextTierIndex) {
    return "next";
  }

  return "locked";
}
