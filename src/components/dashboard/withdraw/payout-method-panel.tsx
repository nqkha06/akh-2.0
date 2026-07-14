import Link from "next/link";
import { AlertCircle, Building2, CheckCircle2, Clock3, ShieldCheck } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import type { WithdrawalController } from "./use-withdrawal-controller";
import { formatCurrency } from "./use-withdrawal-controller";

export function PayoutMethodPanel({ controller }: { controller: WithdrawalController }) {
  const { data, selectedMethod } = controller;
  if (!data) return null;

  return (
    <aside className="h-fit rounded-lg border border-border bg-card">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-base font-semibold tracking-[-0.01em]">Phương thức nhận tiền</h2>
        <p className="mt-1 text-sm text-muted-foreground">Thông tin dùng cho yêu cầu hiện tại.</p>
      </div>
      <div className="space-y-5 p-5">
        {selectedMethod ? (
          <>
            <div className="flex items-start gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-md border border-border bg-muted/40 text-primary"><Building2 className="size-5" /></div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><p className="font-medium">{selectedMethod.provider}</p>{selectedMethod.verified ? <Badge variant="secondary"><CheckCircle2 />Đã xác minh</Badge> : <Badge variant="destructive"><AlertCircle />Chưa xác minh</Badge>}</div>
                <p className="mt-1 text-sm text-muted-foreground">{selectedMethod.accountHolder}</p>
                <p className="mt-0.5 font-mono text-sm text-foreground">{selectedMethod.maskedAccount}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.payoutMethods.length > 1 ? <Button variant="outline" size="sm">Thay đổi</Button> : null}
              <Button variant="ghost" size="sm" asChild><Link href="/member/account">Quản lý phương thức</Link></Button>
            </div>
            {!selectedMethod.verified ? <Alert><AlertCircle /><AlertTitle>Cần xác minh phương thức</AlertTitle><AlertDescription><span>Yêu cầu rút tiền sẽ bị khóa cho đến khi hoàn tất.</span><Button variant="outline" size="sm" className="mt-3">Xác minh ngay</Button></AlertDescription></Alert> : null}
          </>
        ) : (
          <div className="py-4 text-center"><Building2 className="mx-auto size-6 text-muted-foreground" /><p className="mt-3 text-sm font-medium">Chưa có phương thức nhận tiền</p><Button size="sm" className="mt-4">Thêm phương thức</Button></div>
        )}

        <Separator />
        <section>
          <h3 className="flex items-center gap-2 text-sm font-medium"><ShieldCheck className="size-4 text-muted-foreground" />Hạn mức</h3>
          <dl className="mt-3 space-y-2.5 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Tối thiểu mỗi lần</dt><dd className="font-medium tabular-nums">{formatCurrency(data.limits.minimum)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Tối đa mỗi lần</dt><dd className="font-medium tabular-nums">{formatCurrency(data.limits.maximum)}</dd></div>
            {data.limits.remaining != null ? <div className="flex justify-between gap-4"><dt className="text-muted-foreground">{data.limits.remainingLabel ?? "Hạn mức còn lại"}</dt><dd className="font-medium tabular-nums">{formatCurrency(data.limits.remaining)}</dd></div> : null}
          </dl>
        </section>
        {data.processingEstimate ? <><Separator /><section><h3 className="flex items-center gap-2 text-sm font-medium"><Clock3 className="size-4 text-muted-foreground" />Thời gian xử lý</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Dự kiến {data.processingEstimate}. Thời gian thực tế có thể thay đổi theo ngân hàng nhận tiền.</p></section></> : null}
      </div>
    </aside>
  );
}
