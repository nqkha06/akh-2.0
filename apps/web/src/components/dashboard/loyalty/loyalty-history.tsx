import { useLocale, useTranslations } from "next-intl";

import { loyaltyCardClass } from "@/components/dashboard/loyalty/loyalty-ui";
import { SoftCard } from "@/components/dashboard/ui";
import type { LoyaltyHistoryRow } from "@/features/loyalty/types";

export function LoyaltyHistory({
  history,
  windowDays,
}: {
  history: LoyaltyHistoryRow[];
  windowDays: number;
}) {
  const t = useTranslations("SimplePages.loyalty");

  return (
    <SoftCard className={`${loyaltyCardClass} overflow-hidden`}>
      <header className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <h2 className="type-card-title text-foreground">
          {t("historyTitle")}
        </h2>
      </header>

      <div className="w-full overflow-x-auto">
        <table className="type-body-sm w-full min-w-[38rem] border-collapse">
          <caption className="sr-only">
            {t("historyCaption", { days: windowDays })}
          </caption>
          <thead className="type-label border-b border-border bg-muted/30 text-left text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3.5 font-medium sm:px-6">
                {t("date")}
              </th>
              <th scope="col" className="px-4 py-3.5 text-right font-medium">
                {t("dailyViews")}
              </th>
              <th scope="col" className="px-4 py-3.5 text-right font-medium">
                {t("rollingViews", { days: windowDays })}
              </th>
              <th
                scope="col"
                className="px-4 py-3.5 text-right font-medium sm:px-6"
              >
                {t("tier")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {history.map((row) => (
              <HistoryRow key={row.date} row={row} />
            ))}
          </tbody>
        </table>
      </div>
    </SoftCard>
  );
}

function HistoryRow({ row }: { row: LoyaltyHistoryRow }) {
  const locale = useLocale();
  const t = useTranslations("SimplePages.loyalty");
  const number = new Intl.NumberFormat(locale);
  const formattedDate = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${row.date}T00:00:00.000Z`));

  return (
    <tr className="transition-colors hover:bg-muted/30">
      <th
        scope="row"
        className="whitespace-nowrap px-4 py-3.5 text-left font-medium text-foreground sm:px-6"
      >
        {formattedDate}
      </th>
      <td className="whitespace-nowrap px-4 py-3.5 text-right text-foreground/80">
        {number.format(row.dailyValidViews)}
      </td>
      <td className="whitespace-nowrap px-4 py-3.5 text-right font-medium text-primary">
        {number.format(row.rollingValidViews)}
      </td>
      <td className="px-4 py-3.5 text-right sm:px-6">
        <span className="type-caption inline-flex rounded-full border border-border bg-muted/40 px-2 py-0.5 font-medium text-foreground">
          {row.tier?.name ?? t("unranked")}
        </span>
      </td>
    </tr>
  );
}
