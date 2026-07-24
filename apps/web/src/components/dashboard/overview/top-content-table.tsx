"use client";

import Link from "next/link";
import { Archive, BarChart3, Copy, Edit3, MoreHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMemberCurrency } from "@/features/currencies/components/member-currency-provider";

import type { ContentStatus, TopContentItem } from "./types";

const numberFormatter = new Intl.NumberFormat("vi-VN");

const statusLabel: Record<ContentStatus, string> = {
  active: "Đang hoạt động",
  draft: "Bản nháp",
  paused: "Đã tạm dừng",
  expired: "Đã hết hạn",
};

function StatusBadge({ status }: { status: ContentStatus }) {
  if (status === "expired") return <Badge variant="destructive">{statusLabel[status]}</Badge>;

  return (
    <Badge variant={status === "draft" ? "secondary" : "outline"} className="gap-1.5 font-normal">
      <span
        className={`size-1.5 rounded-full ${status === "active" ? "bg-[var(--overview-success)]" : status === "paused" ? "bg-muted-foreground" : "bg-primary"}`}
        aria-hidden="true"
      />
      {statusLabel[status]}
    </Badge>
  );
}

function RowActions({ item }: { item: TopContentItem }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Mở hành động cho ${item.name}`}>
          <MoreHorizontal aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem asChild><Link href={`${item.href}?action=edit`}><Edit3 />Chỉnh sửa</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href={`${item.href}?view=analytics`}><BarChart3 />Phân tích</Link></DropdownMenuItem>
        <DropdownMenuItem><Copy />Nhân bản</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive"><Archive />Lưu trữ</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function TopContentTable({ items }: { items: TopContentItem[] }) {
  const { formatCurrency } = useMemberCurrency();
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card" aria-labelledby="top-content-title">
      <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
        <div>
          <h2 id="top-content-title" className="text-base font-semibold tracking-tight text-card-foreground">Nội dung hiệu quả nhất</h2>
          <p className="mt-1 text-sm text-muted-foreground">Xếp hạng theo hiệu suất trong khoảng thời gian đã chọn.</p>
        </div>
        <span className="hidden text-xs text-muted-foreground sm:block">Top {items.length}</span>
      </div>

      <div className="hidden max-h-[27rem] overflow-auto md:block">
        <Table className="min-w-[950px]">
          <TableHeader className="sticky top-0 z-10 bg-card shadow-[0_1px_0_var(--border)]">
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-11 px-5 text-xs text-muted-foreground">Tên</TableHead>
              <TableHead className="h-11 text-xs text-muted-foreground">Loại</TableHead>
              <TableHead className="h-11 text-xs text-muted-foreground">Trạng thái</TableHead>
              <TableHead className="h-11 text-right text-xs text-muted-foreground">Lượt truy cập</TableHead>
              <TableHead className="h-11 text-right text-xs text-muted-foreground">Mở khóa</TableHead>
              <TableHead className="h-11 text-right text-xs text-muted-foreground">Chuyển đổi</TableHead>
              <TableHead className="h-11 text-right text-xs text-muted-foreground">Doanh thu</TableHead>
              <TableHead className="h-11 w-12"><span className="sr-only">Hành động</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="px-5 py-3.5">
                  <Link href={item.href} className="font-medium text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline">{item.name}</Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{item.type}</TableCell>
                <TableCell><StatusBadge status={item.status} /></TableCell>
                <TableCell className="text-right font-medium tabular-nums text-foreground">{numberFormatter.format(item.visits)}</TableCell>
                <TableCell className="text-right font-medium tabular-nums text-foreground">{numberFormatter.format(item.unlocks)}</TableCell>
                <TableCell className="text-right font-medium tabular-nums text-foreground">{item.conversion.toLocaleString("vi-VN")}%</TableCell>
                <TableCell className="text-right font-medium tabular-nums text-foreground">{formatCurrency(item.revenue, { sourceCurrency: item.revenueCurrency })}</TableCell>
                <TableCell className="pr-3"><RowActions item={item} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="divide-y divide-border md:hidden">
        {items.map((item) => (
          <article key={item.id} className="px-4 py-4 transition-colors hover:bg-muted/30">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <Link href={item.href} className="block truncate text-sm font-medium text-foreground underline-offset-4 hover:underline">{item.name}</Link>
                <p className="mt-1 text-xs text-muted-foreground">{item.type}</p>
              </div>
              <RowActions item={item} />
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <StatusBadge status={item.status} />
              <div className="text-right">
                <p className="text-sm font-semibold tabular-nums text-foreground">{item.conversion.toLocaleString("vi-VN")}%</p>
                <p className="text-[11px] text-muted-foreground">chuyển đổi</p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="border-t border-border px-5 py-3.5 sm:px-6">
        <Button variant="link" className="h-auto px-0 text-sm" asChild>
          <Link href="/member/links">Xem tất cả nội dung</Link>
        </Button>
      </div>
    </section>
  );
}
