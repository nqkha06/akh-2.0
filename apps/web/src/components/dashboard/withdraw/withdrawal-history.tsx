import { useMemo } from "react";
import { AlertCircle, Ban, CheckCircle2, ChevronRight, CircleAlert, Clock3, Copy, Download, MoreHorizontal, RefreshCcw, SearchX, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

import type { WithdrawalStatus, WithdrawalTransaction } from "./types";
import type { WithdrawalController } from "./use-withdrawal-controller";
import { formatCurrency, formatDateTime } from "./use-withdrawal-controller";

const statusConfig: Record<WithdrawalStatus, { label: string; icon: typeof Clock3; className: string }> = {
  processing: { label: "Đang xử lý", icon: Clock3, className: "border-border bg-muted text-foreground" },
  paid: { label: "Đã thanh toán", icon: CheckCircle2, className: "border-primary/20 bg-primary/10 text-primary" },
  failed: { label: "Thất bại", icon: CircleAlert, className: "border-destructive/20 bg-destructive/10 text-destructive" },
  cancelled: { label: "Đã hủy", icon: Ban, className: "border-border bg-muted text-muted-foreground" },
  verification_required: { label: "Cần xác minh", icon: ShieldAlert, className: "border-primary/20 bg-primary/10 text-primary" },
};

export function WithdrawalStatusBadge({ status }: { status: WithdrawalStatus }) {
  const config = statusConfig[status];
  const Icon = config.icon;
  return <Badge variant="outline" className={cn("gap-1 whitespace-nowrap font-medium", config.className)}><Icon className="size-3.5" />{config.label}</Badge>;
}

export function WithdrawalHistoryFilters({ controller }: { controller: WithdrawalController }) {
  const statusLabel = controller.statusFilter === "all" ? "Mọi trạng thái" : statusConfig[controller.statusFilter].label;
  const dateLabel = controller.dateFilter === "30d" ? "30 ngày qua" : controller.dateFilter === "90d" ? "90 ngày qua" : "Mọi thời gian";
  const sortLabel = controller.sort === "newest" ? "Mới nhất" : "Cũ nhất";
  return (
    <div className="grid w-full grid-cols-1 gap-2 sm:w-auto sm:grid-cols-3">
      <Select value={controller.statusFilter} onValueChange={(value) => controller.setStatusFilter(value as WithdrawalStatus | "all")}><SelectTrigger aria-label="Lọc theo trạng thái" className="h-9 w-full sm:w-[150px]"><SelectValue>{statusLabel}</SelectValue></SelectTrigger><SelectContent><SelectItem value="all">Mọi trạng thái</SelectItem><SelectItem value="processing">Đang xử lý</SelectItem><SelectItem value="paid">Đã thanh toán</SelectItem><SelectItem value="failed">Thất bại</SelectItem><SelectItem value="cancelled">Đã hủy</SelectItem><SelectItem value="verification_required">Cần xác minh</SelectItem></SelectContent></Select>
      <Select value={controller.dateFilter} onValueChange={(value) => controller.setDateFilter(value as "all" | "30d" | "90d")}><SelectTrigger aria-label="Lọc theo thời gian" className="h-9 w-full sm:w-[135px]"><SelectValue>{dateLabel}</SelectValue></SelectTrigger><SelectContent><SelectItem value="all">Mọi thời gian</SelectItem><SelectItem value="30d">30 ngày qua</SelectItem><SelectItem value="90d">90 ngày qua</SelectItem></SelectContent></Select>
      <Select value={controller.sort} onValueChange={(value) => controller.setSort(value as "newest" | "oldest")}><SelectTrigger aria-label="Sắp xếp" className="h-9 w-full sm:w-[130px]"><SelectValue>{sortLabel}</SelectValue></SelectTrigger><SelectContent><SelectItem value="newest">Mới nhất</SelectItem><SelectItem value="oldest">Cũ nhất</SelectItem></SelectContent></Select>
    </div>
  );
}

function HistoryActions({ transaction, onView }: { transaction: WithdrawalTransaction; onView: () => void }) {
  const copyId = async () => { await navigator.clipboard.writeText(transaction.id); toast.success("Đã sao chép mã giao dịch."); };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm" aria-label={`Thao tác cho ${transaction.id}`}><MoreHorizontal /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onView}><ChevronRight />Xem chi tiết</DropdownMenuItem>
        <DropdownMenuItem onClick={() => void copyId()}><Copy />Sao chép mã giao dịch</DropdownMenuItem>
        {transaction.receiptUrl ? <DropdownMenuItem asChild><a href={transaction.receiptUrl} download><Download />Tải biên nhận</a></DropdownMenuItem> : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function WithdrawalEmptyState({ filtered = false }: { filtered?: boolean }) {
  return (
    <div className="border-y border-border px-4 py-10 text-center sm:py-12">
      <SearchX className="mx-auto size-7 text-muted-foreground" />
      <h3 className="mt-3 text-base font-semibold">{filtered ? "Không tìm thấy giao dịch phù hợp" : "Chưa có giao dịch rút tiền"}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{filtered ? "Hãy thử thay đổi bộ lọc lịch sử." : "Mọi yêu cầu rút tiền của bạn sẽ xuất hiện tại đây."}</p>
    </div>
  );
}

export function WithdrawalHistory({ controller }: { controller: WithdrawalController }) {
  const { data, historyError, filteredTransactions, setDetailTransaction } = controller;
  const filtersActive = useMemo(() => controller.statusFilter !== "all" || controller.dateFilter !== "all", [controller.dateFilter, controller.statusFilter]);
  if (!data) return null;
  return (
    <section aria-labelledby="withdrawal-history-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><h2 id="withdrawal-history-title" className="text-lg font-semibold tracking-[-0.015em]">Lịch sử rút tiền</h2><p className="mt-1 text-sm text-muted-foreground">Theo dõi tiến độ và thông tin các yêu cầu trước đây.</p></div>
        <WithdrawalHistoryFilters controller={controller} />
      </div>
      {historyError ? <Alert variant="destructive" className="mt-4"><AlertCircle /><AlertTitle>Không thể tải lịch sử rút tiền.</AlertTitle><AlertDescription><span>{historyError}</span><Button variant="outline" size="sm" className="mt-2"><RefreshCcw />Thử lại</Button></AlertDescription></Alert> : !filteredTransactions.length ? <div className="mt-4"><WithdrawalEmptyState filtered={filtersActive || data.transactions.length > 0} /></div> : (
        <div className="mt-4 overflow-hidden rounded-lg border border-border bg-card">
          <div className="hidden overflow-x-auto md:block">
            <Table className="min-w-[960px]">
              <TableHeader><TableRow className="bg-muted/30"><TableHead>Mã giao dịch</TableHead><TableHead>Ngày tạo</TableHead><TableHead>Phương thức</TableHead><TableHead className="text-right">Số tiền</TableHead><TableHead className="text-right">Phí</TableHead><TableHead className="text-right">Thực nhận</TableHead><TableHead>Trạng thái</TableHead><TableHead className="w-12"><span className="sr-only">Thao tác</span></TableHead></TableRow></TableHeader>
              <TableBody>{filteredTransactions.map((transaction) => <TableRow key={transaction.id} className="h-16"><TableCell><button type="button" className="font-mono text-xs font-medium hover:text-primary" onClick={() => setDetailTransaction(transaction)}>{transaction.id}</button></TableCell><TableCell className="text-sm text-muted-foreground">{formatDateTime(transaction.createdAt)}</TableCell><TableCell><div><p className="text-sm font-medium">{transaction.method.provider}</p><p className="text-xs text-muted-foreground">{transaction.method.maskedAccount}</p></div></TableCell><TableCell className="text-right font-medium tabular-nums">{formatCurrency(transaction.requestedAmount)}</TableCell><TableCell className="text-right text-muted-foreground tabular-nums">{formatCurrency(transaction.feeAmount)}</TableCell><TableCell className="text-right font-medium tabular-nums">{formatCurrency(transaction.netAmount)}</TableCell><TableCell><WithdrawalStatusBadge status={transaction.status} /></TableCell><TableCell><HistoryActions transaction={transaction} onView={() => setDetailTransaction(transaction)} /></TableCell></TableRow>)}</TableBody>
            </Table>
          </div>
          <div className="divide-y divide-border md:hidden">{filteredTransactions.map((transaction) => <button key={transaction.id} type="button" className="flex min-h-24 w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30" onClick={() => setDetailTransaction(transaction)}><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><span className="truncate font-mono text-xs font-medium">{transaction.id}</span><span className="shrink-0 font-semibold tabular-nums">{formatCurrency(transaction.netAmount)}</span></div><div className="mt-2 flex flex-wrap items-center justify-between gap-2"><span className="text-xs text-muted-foreground">{formatDateTime(transaction.createdAt)}</span><WithdrawalStatusBadge status={transaction.status} /></div></div><ChevronRight className="size-4 shrink-0 text-muted-foreground" /></button>)}</div>
        </div>
      )}
    </section>
  );
}
