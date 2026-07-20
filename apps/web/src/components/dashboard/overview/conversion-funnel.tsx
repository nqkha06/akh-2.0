import type { FunnelStep } from "./types";

const numberFormatter = new Intl.NumberFormat("vi-VN");

export function ConversionFunnel({ steps }: { steps: FunnelStep[] }) {
  const maximum = Math.max(...steps.map((step) => step.value), 1);

  return (
    <section className="rounded-xl border border-border bg-card" aria-labelledby="funnel-title">
      <div className="border-b border-border px-5 py-4">
        <h2 id="funnel-title" className="text-base font-semibold tracking-tight text-card-foreground">Phễu chuyển đổi</h2>
        <p className="mt-1 text-sm text-muted-foreground">Xem người dùng rời đi ở bước nào.</p>
      </div>
      <ol className="px-5 py-5">
        {steps.map((step, index) => (
          <li key={step.id} className={index === 0 ? "" : "mt-5"}>
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{step.label}</p>
                {step.rateFromPrevious ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">{step.rateFromPrevious.toLocaleString("vi-VN")}% từ bước trước</p>
                ) : (
                  <p className="mt-0.5 text-xs text-muted-foreground">Điểm bắt đầu</p>
                )}
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">{numberFormatter.format(step.value)}</span>
            </div>
            <div className="mt-2.5 h-2 overflow-hidden rounded-sm bg-muted" aria-hidden="true">
              <div
                className="h-full rounded-sm bg-primary transition-[width] duration-200 motion-reduce:transition-none"
                style={{ width: `${Math.max((step.value / maximum) * 100, 2)}%`, opacity: 1 - index * 0.14 }}
              />
            </div>
          </li>
        ))}
      </ol>
      <div className="border-t border-border px-5 py-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Chuyển đổi toàn phễu</span>
          <span className="font-semibold text-foreground">
            {steps.length > 1 ? ((steps.at(-1)!.value / steps[0].value) * 100).toLocaleString("vi-VN", { maximumFractionDigits: 1 }) : 0}%
          </span>
        </div>
      </div>
    </section>
  );
}

