import Link from "next/link";
import { Building2, Clock3, Settings2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import type { WithdrawalController } from "./use-withdrawal-controller";

export function PayoutMethodPanel({ controller }: { controller: WithdrawalController }) {
  const { data, selectedMethod, formatCurrency } = controller;
  if (!data) return null;

  return (
    <aside className="h-fit overflow-hidden rounded-2xl border border-border bg-card shadow-sm shadow-black/[0.025]">
      <div className="border-b border-border/80 px-5 py-5">
        <h2 className="text-base font-semibold tracking-[-0.015em] sm:text-[17px]">Phương thức nhận tiền</h2>
      </div>
      <div className="space-y-5 p-5">
        {selectedMethod ? (
          <>
            <div className="flex items-start gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/[0.08] text-primary ring-1 ring-primary/10"><Building2 className="size-5" /></div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{selectedMethod.provider}</p>
                <p className="mt-1 text-sm text-muted-foreground">{selectedMethod.accountHolder}</p>
                <p className="mt-0.5 font-mono text-sm text-foreground">{selectedMethod.maskedAccount}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-fit" asChild><Link href="/member/account#payment-method"><Settings2 />Quản lý phương thức</Link></Button>
          </>
        ) : (
          <div className="py-4 text-center"><Building2 className="mx-auto size-6 text-muted-foreground" /><p className="mt-3 text-sm font-medium">Chưa có phương thức nhận tiền</p><Button size="sm" className="mt-4" asChild><Link href="/member/account#payment-method">Thêm phương thức</Link></Button></div>
        )}

        <Separator />
        <section>
          <h3 className="flex items-center gap-2 text-sm font-medium"><ShieldCheck className="size-4 text-muted-foreground" />Hạn mức</h3>
          <dl className="mt-3 space-y-2.5 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Tối thiểu mỗi lần</dt><dd className="font-medium tabular-nums">{formatCurrency(selectedMethod?.minimumAmount ?? data.limits.minimum)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Phí xử lý</dt><dd className="font-medium tabular-nums">{formatCurrency(selectedMethod?.withdrawFee ?? 0)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Tối đa mỗi lần</dt><dd className="font-medium tabular-nums">{formatCurrency(data.limits.maximum)}</dd></div>
            {data.limits.remaining != null ? <div className="flex justify-between gap-4"><dt className="text-muted-foreground">{data.limits.remainingLabel ?? "Hạn mức còn lại"}</dt><dd className="font-medium tabular-nums">{formatCurrency(data.limits.remaining)}</dd></div> : null}
          </dl>
        </section>
        {data.processingEstimate ? <><Separator /><section><h3 className="flex items-center gap-2 text-sm font-medium"><Clock3 className="size-4 text-muted-foreground" />Thời gian xử lý</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Dự kiến {data.processingEstimate}. Thời gian thực tế có thể thay đổi theo ngân hàng nhận tiền.</p></section></> : null}
      </div>
    </aside>
  );
}
