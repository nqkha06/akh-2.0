import {
  Archive,
  CircleDashed,
  Send,
  type LucideIcon,
} from "lucide-react";

import type { PageStatus } from "@/features/admin-pages/types";

export const pageStatusConfig: Record<
  PageStatus,
  {
    label: string;
    description: string;
    badgeClassName: string;
    icon: LucideIcon;
  }
> = {
  DRAFT: {
    label: "Nháp",
    description: "Chỉ quản trị viên có thể xem trước trang.",
    badgeClassName: "border-border bg-muted text-muted-foreground",
    icon: CircleDashed,
  },
  PUBLISHED: {
    label: "Đã xuất bản",
    description: "Trang đã sẵn sàng để hiển thị công khai.",
    badgeClassName:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
    icon: Send,
  },
  ARCHIVED: {
    label: "Đã lưu trữ",
    description: "Trang được giữ lại nhưng không còn xuất bản.",
    badgeClassName:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
    icon: Archive,
  },
};

export const pageStatusOptions = (
  Object.entries(pageStatusConfig) as Array<
    [PageStatus, (typeof pageStatusConfig)[PageStatus]]
  >
).map(([value, config]) => ({
  value,
  label: config.label,
  icon: config.icon,
}));
