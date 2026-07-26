import {
  currentTier,
  viewHistory,
  type ViewHistoryRow,
} from "@/components/dashboard/loyalty/loyalty-data";
import { loyaltyCardClass } from "@/components/dashboard/loyalty/loyalty-ui";
import { SoftCard } from "@/components/dashboard/ui";

export function LoyaltyHistory() {
  return (
    <SoftCard className={`${loyaltyCardClass} overflow-hidden`}>
      <header className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <h2 className="text-lg font-medium tracking-[-0.02em] text-foreground">
          Lịch sử tích lũy
        </h2>
      </header>

      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">
            Lịch sử lượt xem hợp lệ và hạng thành viên trong 7 ngày gần đây
          </caption>
          <thead className="border-b border-border bg-muted/30 text-left text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
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
          <tbody className="divide-y divide-border">
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
    <tr className="transition-colors hover:bg-muted/30">
      <th
        scope="row"
        className="whitespace-nowrap px-4 py-3.5 text-left font-medium text-foreground sm:px-6"
      >
        {row.date}
      </th>
      <td className="hidden whitespace-nowrap px-4 py-3.5 text-right text-foreground/80 sm:table-cell">
        {isProcessing ? <ProcessingLabel /> : row.dailyViews}
      </td>
      <td className="whitespace-nowrap px-4 py-3.5 text-right font-medium text-primary">
        {isProcessing ? <ProcessingLabel /> : row.rollingViews}
      </td>
      <td className="px-4 py-3.5 text-right sm:px-6">
        <span className="inline-flex rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-foreground">
          {currentTier.name}
        </span>
      </td>
    </tr>
  );
}

function ProcessingLabel() {
  return (
    <span className="text-xs font-normal text-muted-foreground">
      Đang tổng hợp
    </span>
  );
}
