import { Circle } from "lucide-react";

import {
  currentTier,
  viewHistory,
  type ViewHistoryRow,
} from "@/components/dashboard/loyalty/loyalty-data";
import {
  loyaltyCardClass,
  sectionLabelClass,
} from "@/components/dashboard/loyalty/loyalty-ui";
import { SoftCard } from "@/components/dashboard/ui";

export function LoyaltyHistory() {
  return (
    <SoftCard className={`${loyaltyCardClass} overflow-hidden`}>
      <header className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-[#23252a]">
        <div>
          <h2 className="mt-1 text-lg font-medium tracking-[-0.02em] text-slate-950 dark:text-[#f7f8f8]">
            Lịch sử tích lũy
          </h2>
        </div>

        
      </header>

      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">
            Lịch sử lượt xem hợp lệ và hạng thành viên trong 7 ngày gần đây
          </caption>
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase tracking-[0.1em] text-slate-600 dark:border-[#23252a] dark:bg-[#141516] dark:text-[#8a8f98]">
            <tr>
              <th scope="col" className="px-4 py-3.5 font-medium sm:px-6">
                Ngày
              </th>
              <th
                scope="col"
                className="hidden px-4 py-3.5 text-right font-medium sm:table-cell"
              >
                Lượt xem ngày
              </th>
              <th scope="col" className="px-4 py-3.5 text-right font-medium">
                Tích lũy 7 ngày
              </th>
              <th
                scope="col"
                className="px-4 py-3.5 text-right font-medium sm:px-6"
              >
                Hạng
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-[#23252a]">
            {viewHistory.map((row) => (
              <HistoryRow key={row.date} row={row} />
            ))}
          </tbody>
        </table>
      </div>
    </SoftCard>
  );
}

function HistoryRow({ row }: { row: ViewHistoryRow }) {
  const isProcessing = row.dailyViews === null;

  return (
    <tr className="transition-colors hover:bg-slate-50 dark:hover:bg-[#141516]">
      <th
        scope="row"
        className="whitespace-nowrap px-4 py-3.5 text-left font-medium text-slate-950 sm:px-6 dark:text-[#f7f8f8]"
      >
        {row.date}
      </th>
      <td className="hidden whitespace-nowrap px-4 py-3.5 text-right text-slate-700 sm:table-cell dark:text-[#d0d6e0]">
        {isProcessing ? <ProcessingLabel /> : row.dailyViews}
      </td>
      <td className="whitespace-nowrap px-4 py-3.5 text-right font-medium text-[#5e6ad2] dark:text-[#c4c9ff]">
        {isProcessing ? <ProcessingLabel /> : row.rollingViews}
      </td>
      <td className="px-4 py-3.5 text-right sm:px-6">
        <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:border-[#34343a] dark:bg-[#18191a] dark:text-[#d0d6e0]">
          {currentTier.name}
        </span>
      </td>
    </tr>
  );
}

function ProcessingLabel() {
  return (
    <span className="text-xs font-normal text-slate-500 dark:text-[#62666d]">
      Đang tổng hợp
    </span>
  );
}
