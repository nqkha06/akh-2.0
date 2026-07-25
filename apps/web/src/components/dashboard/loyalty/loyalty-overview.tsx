import { Clock3, Sparkles } from "lucide-react";

import {
  currentTier,
  currentViews,
  nextTier,
  nextTierTarget,
  progress,
  remainingViews,
} from "@/components/dashboard/loyalty/loyalty-data";
import {
  loyaltyCardClass,
  sectionLabelClass,
  StatusBadge,
} from "@/components/dashboard/loyalty/loyalty-ui";
import { SoftCard } from "@/components/dashboard/ui";

export function LoyaltyOverview() {
  return (
    <SoftCard className={`${loyaltyCardClass} p-5 sm:p-6`}>
      <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_18rem] sm:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className={sectionLabelClass}>Hạng hiện tại</p>
            <StatusBadge status="current" />
          </div>

          <div className="mt-3 flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-lg border border-[#5e6ad2]/25 bg-[#5e6ad2]/10 text-[#5e6ad2] dark:border-[#5e6ad2]/35 dark:bg-[#5e6ad2]/15 dark:text-[#aab2ff]">
              <Sparkles className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-[28px] font-semibold leading-tight tracking-[-0.04em] text-slate-950 dark:text-[#f7f8f8]">
                {currentTier.name}
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-[#8a8f98]">
                Được xét theo lượt xem hợp lệ trong 7 ngày gần nhất
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-[#5e6ad2]/15 bg-[#5e6ad2]/[0.06] px-5 py-4 text-center dark:border-[#5e6ad2]/25 dark:bg-[#5e6ad2]/[0.09]">
          <p className="text-xs font-medium uppercase tracking-[0.1em] text-[#5e6ad2] dark:text-[#aab2ff]">
            Mốc tiếp theo
          </p>
          <p className="mt-2 text-lg font-medium text-slate-950 dark:text-[#f7f8f8]">
            Hạng {nextTier.name}
          </p>
          <p className="mt-1 text-xs text-slate-600 dark:text-[#8a8f98]">
            Yêu cầu {nextTierTarget.toLocaleString("vi-VN")} lượt xem
          </p>
        </div>
      </div>

      <div className="mt-6 border-t border-slate-200 pt-5 dark:border-[#23252a]">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <p className="font-medium text-slate-700 dark:text-[#d0d6e0]">
            Tiến độ đến hạng {nextTier.name}
          </p>
          <p className="font-medium text-[#5e6ad2] dark:text-[#aab2ff]">
            {currentViews.toLocaleString("vi-VN")} /{" "}
            {nextTierTarget.toLocaleString("vi-VN")} · {progress}%
          </p>
        </div>

        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-[#23252a]"
          role="progressbar"
          aria-label={`Tiến độ lên hạng ${nextTier.name}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <div
            className="h-full rounded-full bg-[#5e6ad2] transition-[width] duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="mt-2 text-right text-xs text-slate-500 dark:text-[#62666d]">
          Còn {remainingViews.toLocaleString("vi-VN")} lượt xem
        </p>
      </div>

      <div className="mt-5 flex gap-3 rounded-lg border-l-2 border-[#5e6ad2] bg-[#5e6ad2]/[0.06] px-4 py-3 dark:bg-[#5e6ad2]/[0.09]">
        <Clock3
          className="mt-0.5 size-4 shrink-0 text-[#5e6ad2] dark:text-[#aab2ff]"
          aria-hidden="true"
        />
        <div className="text-sm leading-6">
          <p className="font-medium text-slate-900 dark:text-[#f7f8f8]">
            Dữ liệu hôm nay đang được tổng hợp
          </p>
          <p className="text-slate-600 dark:text-[#8a8f98]">
            Hạng thành viên được cập nhật hằng ngày trong khoảng 00:00 – 01:00.
          </p>
        </div>
      </div>
    </SoftCard>
  );
}
