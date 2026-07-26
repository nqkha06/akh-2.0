"use client";

import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  MessageCircle,
  Tickets,
} from "lucide-react";

import { PageContainer, PageHeader } from "@/components/dashboard/ui";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSiteBrand } from "@/features/site-settings/components/site-brand-provider";
import { cn } from "@/lib/utils";

import type { SupportRequest } from "./types";

const summaryItems = [
  {
    key: "total",
    label: "Tổng ticket",
    description: "Tất cả yêu cầu đã gửi",
    icon: Tickets,
  },
  {
    key: "active",
    label: "Đang xử lý",
    description: "Ticket chưa hoàn tất",
    icon: Clock3,
  },
  {
    key: "waiting",
    label: "Chờ bạn phản hồi",
    description: "Cần bổ sung thông tin",
    icon: MessageCircle,
  },
  {
    key: "resolved",
    label: "Đã giải quyết",
    description: "Ticket đã hoàn tất",
    icon: CheckCircle2,
  },
] as const;

export function SupportTicketSummary({ items }: { items: SupportRequest[] }) {
  const counts = {
    total: items.length,
    active: items.filter((item) =>
      ["submitted", "in_progress", "answered"].includes(item.status),
    ).length,
    waiting: items.filter((item) => item.status === "waiting_user").length,
    resolved: items.filter((item) =>
      ["resolved", "closed"].includes(item.status),
    ).length,
  };

  return (
    <section
      aria-label="Tổng quan ticket"
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
    >
      {summaryItems.map((item) => {
        const Icon = item.icon;
        return (
          <Card
            key={item.key}
            className="gap-0 rounded-xl px-4 py-4 shadow-none sm:px-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums tracking-[-0.025em]">
                  {counts[item.key]}
                </p>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {item.description}
                </p>
              </div>
              <span
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-md border bg-muted/30 text-muted-foreground",
                  item.key === "waiting" &&
                    counts.waiting > 0 &&
                    "border-primary/20 bg-primary/10 text-primary",
                )}
              >
                <Icon className="size-4" />
              </span>
            </div>
          </Card>
        );
      })}
    </section>
  );
}

export function SupportSkeleton() {
  return (
    <PageContainer aria-busy="true">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-[460px] rounded-xl" />
    </PageContainer>
  );
}

export function SupportErrorState({ onRetry }: { onRetry: () => void }) {
  const brand = useSiteBrand();
  return (
    <PageContainer>
      <PageHeader
        title="Hỗ trợ"
        description={`Quản lý ticket hỗ trợ của bạn tại ${brand.siteName}.`}
      />
      <Alert variant="destructive">
        <AlertCircle />
        <AlertTitle>Không thể tải danh sách ticket.</AlertTitle>
        <AlertDescription>
          <p>Vui lòng kiểm tra kết nối và thử lại.</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 bg-background"
            onClick={onRetry}
          >
            <LoaderCircle />
            Thử lại
          </Button>
        </AlertDescription>
      </Alert>
    </PageContainer>
  );
}
