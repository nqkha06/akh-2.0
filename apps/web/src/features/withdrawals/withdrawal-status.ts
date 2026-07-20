import type { WithdrawalStatus } from "@/features/withdrawals/types";

export const withdrawalStatusOptions: Array<{
  value: WithdrawalStatus;
  label: string;
  dotClassName: string;
  badgeClassName: string;
}> = [
  {
    value: "pending",
    label: "Chờ xử lý",
    dotClassName: "bg-amber-500",
    badgeClassName:
      "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  {
    value: "processing",
    label: "Đang xử lý",
    dotClassName: "bg-blue-500",
    badgeClassName:
      "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  },
  {
    value: "paid",
    label: "Đã thanh toán",
    dotClassName: "bg-emerald-500",
    badgeClassName:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  {
    value: "rejected",
    label: "Đã từ chối",
    dotClassName: "bg-destructive",
    badgeClassName:
      "border-destructive/20 bg-destructive/10 text-destructive",
  },
  {
    value: "cancelled",
    label: "Member đã hủy",
    dotClassName: "bg-muted-foreground",
    badgeClassName: "border-border bg-muted text-muted-foreground",
  },
];

export function getWithdrawalStatusOption(status: WithdrawalStatus) {
  return (
    withdrawalStatusOptions.find((option) => option.value === status) ??
    withdrawalStatusOptions[0]
  );
}

export function getAllowedWithdrawalStatuses(
  status: WithdrawalStatus,
): WithdrawalStatus[] {
  if (status === "pending") {
    return ["pending", "processing", "rejected"] satisfies WithdrawalStatus[];
  }
  if (status === "processing") {
    return ["processing", "paid", "rejected"] satisfies WithdrawalStatus[];
  }
  return [status];
}

export function formatWithdrawalMoney(value: string) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export function formatWithdrawalDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}
