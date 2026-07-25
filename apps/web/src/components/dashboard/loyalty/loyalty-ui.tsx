import type { TierStatus } from "@/components/dashboard/loyalty/loyalty-data";
import { cn } from "@/lib/utils";

export const loyaltyCardClass = [
  "gap-0 rounded-xl border border-slate-200 bg-white py-0 shadow-none",
  "transition-[background-color,border-color] duration-200",
  "hover:border-slate-200 hover:shadow-none",
  "dark:border-[#23252a] dark:bg-[#0f1011]",
  "dark:hover:border-[#23252a] dark:hover:shadow-none",
].join(" ");

export const sectionLabelClass =
  "text-xs font-medium uppercase tracking-[0.12em] text-slate-600 dark:text-[#8a8f98]";

export function StatusBadge({
  status,
}: {
  status: Exclude<TierStatus, "locked">;
}) {
  const label = status === "current" ? "Hiện tại" : "Kế tiếp";

  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium",
        status === "current"
          ? "border-[#5e6ad2]/25 bg-[#5e6ad2]/10 text-[#525dbd] dark:border-[#5e6ad2]/35 dark:bg-[#5e6ad2]/15 dark:text-[#c4c9ff]"
          : "border-slate-200 bg-white text-slate-600 dark:border-[#34343a] dark:bg-[#18191a] dark:text-[#d0d6e0]",
      )}
    >
      {label}
    </span>
  );
}
