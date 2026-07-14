import type { BioPageDto } from "@/lib/api-client"
import { getBioCtr } from "./types"

export function LinkInBioMetrics({ page }: { page: BioPageDto }) {
  const metrics = [
    { label: "Lượt xem", value: page.views.toLocaleString("vi-VN") },
    { label: "Lượt nhấp", value: page.clicks.toLocaleString("vi-VN") },
    { label: "Tỷ lệ nhấp", value: `${getBioCtr(page).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%` },
  ]

  return (
    <dl className="grid grid-cols-3 divide-x divide-border">
      {metrics.map((metric, index) => (
        <div key={metric.label} className={index === 0 ? "pr-3" : "px-3 last:pr-0"}>
          <dt className="truncate text-[11px] text-muted-foreground">{metric.label}</dt>
          <dd className="mt-1 truncate text-sm font-semibold tabular-nums text-foreground">{metric.value}</dd>
        </div>
      ))}
    </dl>
  )
}

