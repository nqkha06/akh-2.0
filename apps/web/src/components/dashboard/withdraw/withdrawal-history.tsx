import { useMemo, useState } from "react";
import { AlertCircle, Ban, CheckCircle2, ChevronRight, CircleAlert, Clock3, Copy, Download, MoreHorizontal, ReceiptText, RefreshCcw, SearchX } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { TablePagination } from "@/components/table-pagination";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

import type { WithdrawalStatus, WithdrawalTransaction } from "./types";
import type { WithdrawalController } from "./use-withdrawal-controller";
import { formatDateTime } from "./use-withdrawal-controller";

const statusConfig: Record<WithdrawalStatus, { icon: typeof Clock3; className: string }> = {
  pending: { icon: Clock3, className: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  processing: { icon: Clock3, className: "border-border bg-muted text-foreground" },
  paid: { icon: CheckCircle2, className: "border-primary/20 bg-primary/10 text-primary" },
  rejected: { icon: CircleAlert, className: "border-destructive/20 bg-destructive/10 text-destructive" },
  cancelled: { icon: Ban, className: "border-border bg-muted text-muted-foreground" },
};

export function WithdrawalStatusBadge({ status }: { status: WithdrawalStatus }) {
  const t = useTranslations("Withdraw");
  const config = statusConfig[status];
  const Icon = config.icon;
  return <Badge variant="outline" className={cn("gap-1 whitespace-nowrap font-medium", config.className)}><Icon className="size-3.5" />{t(`status.${status}`)}</Badge>;
}

export function WithdrawalHistoryFilters({
  controller,
  onCriteriaChange,
}: {
  controller: WithdrawalController;
  onCriteriaChange?: () => void;
}) {
  const t = useTranslations("Withdraw");
  const statusLabel = controller.statusFilter === "all" ? t("filters.allStatuses") : t(`status.${controller.statusFilter}`);
  const dateLabel = t(`filters.date.${controller.dateFilter}`);
  const sortLabel = t(`filters.sort.${controller.sort}`);
  return (
    <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:grid-cols-3">
      <Select value={controller.statusFilter} onValueChange={(value) => { controller.setStatusFilter(value as WithdrawalStatus | "all"); onCriteriaChange?.(); }}><SelectTrigger aria-label={t("filters.statusAria")} className="h-10 w-full bg-background shadow-none sm:w-[150px]"><SelectValue>{statusLabel}</SelectValue></SelectTrigger><SelectContent><SelectItem value="all">{t("filters.allStatuses")}</SelectItem><SelectItem value="pending">{t("status.pending")}</SelectItem><SelectItem value="processing">{t("status.processing")}</SelectItem><SelectItem value="paid">{t("status.paid")}</SelectItem><SelectItem value="rejected">{t("status.rejected")}</SelectItem><SelectItem value="cancelled">{t("status.cancelled")}</SelectItem></SelectContent></Select>
      <Select value={controller.dateFilter} onValueChange={(value) => { controller.setDateFilter(value as "all" | "30d" | "90d"); onCriteriaChange?.(); }}><SelectTrigger aria-label={t("filters.dateAria")} className="h-10 w-full bg-background shadow-none sm:w-[135px]"><SelectValue>{dateLabel}</SelectValue></SelectTrigger><SelectContent><SelectItem value="all">{t("filters.date.all")}</SelectItem><SelectItem value="30d">{t("filters.date.30d")}</SelectItem><SelectItem value="90d">{t("filters.date.90d")}</SelectItem></SelectContent></Select>
      <Select value={controller.sort} onValueChange={(value) => { controller.setSort(value as "newest" | "oldest"); onCriteriaChange?.(); }}><SelectTrigger aria-label={t("filters.sortAria")} className="col-span-2 h-10 w-full bg-background shadow-none sm:col-span-1 sm:w-[130px]"><SelectValue>{sortLabel}</SelectValue></SelectTrigger><SelectContent><SelectItem value="newest">{t("filters.sort.newest")}</SelectItem><SelectItem value="oldest">{t("filters.sort.oldest")}</SelectItem></SelectContent></Select>
    </div>
  );
}

function HistoryActions({ transaction, onView }: { transaction: WithdrawalTransaction; onView: () => void }) {
  const t = useTranslations("Withdraw");
  const copyId = async () => { await navigator.clipboard.writeText(transaction.id); toast.success(t("messages.copiedId")); };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm" aria-label={t("history.actionsAria", { id: transaction.id })}><MoreHorizontal /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onView}><ChevronRight />{t("actions.viewDetails")}</DropdownMenuItem>
        <DropdownMenuItem onClick={() => void copyId()}><Copy />{t("actions.copyId")}</DropdownMenuItem>
        {transaction.receiptUrl ? <DropdownMenuItem asChild><a href={transaction.receiptUrl} download><Download />{t("actions.downloadReceipt")}</a></DropdownMenuItem> : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function WithdrawalEmptyState({ filtered = false }: { filtered?: boolean }) {
  const t = useTranslations("Withdraw");
  return (
    <div className="px-4 py-12 text-center sm:py-16">
      <span className="mx-auto grid size-11 place-items-center rounded-xl bg-muted/50 text-muted-foreground"><SearchX className="size-5" /></span>
      <h3 className="mt-3 text-base font-semibold">{filtered ? t("history.filteredEmptyTitle") : t("history.emptyTitle")}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{filtered ? t("history.filteredEmptyDescription") : t("history.emptyDescription")}</p>
    </div>
  );
}

export function WithdrawalHistory({ controller }: { controller: WithdrawalController }) {
  const locale = useLocale();
  const t = useTranslations("Withdraw");
  const { data, historyError, filteredTransactions, setDetailTransaction, formatCurrency } = controller;
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const filtersActive = useMemo(() => controller.statusFilter !== "all" || controller.dateFilter !== "all", [controller.dateFilter, controller.statusFilter]);
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const visibleTransactions = useMemo(() => {
    const startIndex = (safePage - 1) * pageSize;
    return filteredTransactions.slice(startIndex, startIndex + pageSize);
  }, [filteredTransactions, pageSize, safePage]);
  if (!data) return null;
  return (
    <section
      aria-labelledby="withdrawal-history-title"
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm shadow-black/[0.025]"
    >
      <div className="flex flex-col gap-4 border-b border-border/80 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">

          <div className="flex flex-wrap items-center gap-2">
            <h2 id="withdrawal-history-title" className="text-base font-semibold tracking-[-0.015em] sm:text-[17px]">{t("history.title")}</h2>
          </div>
        </div>
        <WithdrawalHistoryFilters controller={controller} onCriteriaChange={() => setPage(1)} />
      </div>
      {historyError ? (
        <div className="p-4 sm:p-5"><Alert variant="destructive"><AlertCircle /><AlertTitle>{t("errors.historyTitle")}</AlertTitle><AlertDescription><span>{historyError}</span><Button variant="outline" size="sm" className="mt-2"><RefreshCcw />{t("actions.retry")}</Button></AlertDescription></Alert></div>
      ) : !filteredTransactions.length ? (
        <WithdrawalEmptyState filtered={filtersActive || data.transactions.length > 0} />
      ) : (
        <>
          <div className="hidden overflow-x-auto lg:block">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow className="h-11 bg-muted/[0.22] hover:bg-muted/[0.22]">
                  <TableHead className="pl-5">{t("history.columns.transaction")}</TableHead>
                  <TableHead>{t("history.columns.method")}</TableHead>
                  <TableHead className="text-right">{t("history.columns.amount")}</TableHead>
                  <TableHead className="text-right">{t("history.columns.fee")}</TableHead>
                  <TableHead className="text-right">{t("history.columns.net")}</TableHead>
                  <TableHead>{t("history.columns.status")}</TableHead>
                  <TableHead className="w-12"><span className="sr-only">{t("history.columns.actions")}</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleTransactions.map((transaction) => (
                  <TableRow key={transaction.id} className="h-[76px] hover:bg-muted/[0.16]">
                    <TableCell className="pl-5">
                      <div className="flex items-center gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted/50 text-muted-foreground"><ReceiptText className="size-4" /></span>
                        <div>
                          <button type="button" className="font-mono text-xs font-semibold hover:text-primary" onClick={() => setDetailTransaction(transaction)}>#{transaction.id}</button>
                          <p className="mt-1 whitespace-nowrap text-xs text-muted-foreground">{formatDateTime(transaction.createdAt, locale)}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><p className="text-sm font-medium">{transaction.method.provider}</p><p className="mt-0.5 text-xs text-muted-foreground">{transaction.method.maskedAccount}</p></TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{formatCurrency(transaction.requestedAmount)}</TableCell>
                    <TableCell className="text-right text-muted-foreground tabular-nums">{formatCurrency(transaction.feeAmount)}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums text-foreground">{formatCurrency(transaction.netAmount)}</TableCell>
                    <TableCell><WithdrawalStatusBadge status={transaction.status} /></TableCell>
                    <TableCell><HistoryActions transaction={transaction} onView={() => setDetailTransaction(transaction)} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="grid gap-3 p-4 lg:hidden">
            {visibleTransactions.map((transaction) => (
              <button
                key={transaction.id}
                type="button"
                aria-label={t("history.viewTransactionAria", { id: transaction.id })}
                className="rounded-xl border border-border bg-background p-4 text-left shadow-sm shadow-black/[0.02] transition-colors hover:border-primary/20 hover:bg-muted/[0.12]"
                onClick={() => setDetailTransaction(transaction)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/[0.08] text-primary"><ReceiptText className="size-4" /></span>
                    <div className="min-w-0"><p className="truncate font-mono text-xs font-semibold">#{transaction.id}</p><p className="mt-1 text-xs text-muted-foreground">{formatDateTime(transaction.createdAt, locale)}</p></div>
                  </div>
                  <WithdrawalStatusBadge status={transaction.status} />
                </div>
                <div className="mt-4 flex items-end justify-between gap-3 border-t border-border/70 pt-3">
                  <div className="min-w-0"><p className="truncate text-sm font-medium">{transaction.method.provider}</p><p className="mt-0.5 truncate text-xs text-muted-foreground">{transaction.method.maskedAccount}</p></div>
                  <div className="shrink-0 text-right"><p className="text-[11px] text-muted-foreground">{t("history.columns.net")}</p><p className="mt-0.5 font-semibold tabular-nums">{formatCurrency(transaction.netAmount)}</p></div>
                  <ChevronRight className="mb-0.5 size-4 shrink-0 text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
          <footer className="border-t border-border px-4 py-3 sm:px-5">
            <TablePagination
              page={safePage}
              pageSize={pageSize}
              totalItems={filteredTransactions.length}
              pageSizeOptions={[5, 10, 20]}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </footer>
        </>
      )}
    </section>
  );
}
