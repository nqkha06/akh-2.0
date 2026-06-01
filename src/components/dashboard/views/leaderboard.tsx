import { Crown, Medal, Trophy } from "lucide-react";

import { Badge, PageHeader, SoftCard, TableShell } from "@/components/dashboard/ui";
import { rankingRows } from "@/lib/dashboard-data";

export function LeaderboardView() {
  const topThree = rankingRows.slice(0, 3);

  return (
    <>
      <PageHeader
        eyebrow="Competition"
        title="Bảng xếp hạng"
        description="Top creator theo thu nhập, điểm và lượt giới thiệu trong tuần, tháng hoặc toàn thời gian."
        action={
          <div className="flex gap-2 rounded-lg border border-slate-200 bg-white p-1 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            {["Tuần", "Tháng", "All-time"].map((item, index) => (
              <button
                key={item}
                className={`h-9 rounded-xl px-3 text-sm font-bold ${
                  index === 1 ? "bg-slate-950 text-white" : "text-slate-500"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        }
      />

      <section className="mb-5 grid gap-4 md:grid-cols-3">
        {topThree.map((row, index) => (
          <SoftCard key={row.name} className="p-5 text-center">
            <div
              className={`mx-auto grid size-16 place-items-center rounded-lg text-white ${
                index === 0
                  ? "bg-amber-500"
                  : index === 1
                    ? "bg-slate-500"
                    : "bg-orange-600"
              }`}
            >
              {index === 0 ? <Crown size={28} /> : <Medal size={28} />}
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-950">{row.name}</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {row.revenue}
            </p>
            <Badge tone={index === 0 ? "amber" : "slate"}>#{row.rank}</Badge>
          </SoftCard>
        ))}
      </section>

      <TableShell
        headers={["Hạng", "Creator", "Cấp độ", "Thu nhập", "Lượt giới thiệu"]}
        rows={rankingRows.map((row) => (
          <tr
            key={row.name}
            className={`transition hover:bg-blue-50/35 ${
              row.name === "Bạn" ? "bg-blue-50/50" : ""
            }`}
          >
            <td className="px-5 py-4 text-blue-600">
              <span className="inline-flex items-center gap-2 font-bold">
                <Trophy size={15} />#{row.rank}
              </span>
            </td>
            <td className="px-5 py-4">{row.name}</td>
            <td className="px-5 py-4">
              <Badge tone={row.name === "Bạn" ? "blue" : "violet"}>
                {row.name === "Bạn" ? "Bạn" : "Pro"}
              </Badge>
            </td>
            <td className="px-5 py-4">{row.revenue}</td>
            <td className="px-5 py-4">{row.views}</td>
          </tr>
        ))}
      />
    </>
  );
}
