import {
  Ban,
  CircleCheck,
  CircleOff,
  LockKeyhole,
  PauseCircle,
} from "lucide-react";

import type { UserStatus } from "@/features/admin-users/types";

export const userStatusConfig: Record<
  UserStatus,
  {
    label: string;
    description: string;
    icon: typeof CircleCheck;
    className: string;
  }
> = {
  active: {
    label: "Hoạt động",
    description: "Có thể đăng nhập và sử dụng hệ thống.",
    icon: CircleCheck,
    className:
      "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  inactive: {
    label: "Không hoạt động",
    description: "Tài khoản tạm thời không thể đăng nhập.",
    icon: CircleOff,
    className: "border-border bg-muted text-muted-foreground",
  },
  locked: {
    label: "Đã khóa",
    description: "Tài khoản bị khóa bởi quản trị viên.",
    icon: LockKeyhole,
    className:
      "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  suspended: {
    label: "Tạm ngưng",
    description: "Tài khoản bị tạm ngưng để xem xét.",
    icon: PauseCircle,
    className:
      "border-orange-500/25 bg-orange-500/10 text-orange-700 dark:text-orange-300",
  },
  disabled: {
    label: "Vô hiệu hóa",
    description: "Tài khoản đã bị vô hiệu hóa.",
    icon: Ban,
    className:
      "border-destructive/25 bg-destructive/10 text-destructive",
  },
};

export const userStatusOptions = Object.entries(userStatusConfig).map(
  ([value, config]) => ({
    value,
    label: config.label,
    icon: config.icon,
  }),
);
