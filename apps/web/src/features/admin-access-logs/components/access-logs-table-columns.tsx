"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { CheckCircle2, Eye, ShieldAlert, XCircle } from "lucide-react";
import Link from "next/link";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { AdminAccessLog } from "../types";

export function getAccessLogsColumns({
  onView,
}: {
  onView: (log: AdminAccessLog) => void;
}): ColumnDef<AdminAccessLog>[] {
  return [
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Thời gian"
          label="Thời gian"
        />
      ),
      cell: ({ row }) => (
        <div className="whitespace-nowrap text-sm">
          <p className="font-medium">{formatDate(row.original.createdAt)}</p>
          <p className="text-xs text-muted-foreground">
            {formatTime(row.original.createdAt)}
          </p>
        </div>
      ),
      enableSorting: false,
    },
    {
      id: "user",
      header: "User",
      cell: ({ row }) => (
        <div className="max-w-56">
          <Link
            href={`/admin/users/${row.original.user.id}`}
            className="font-medium hover:underline"
          >
            {row.original.user.name}
          </Link>
          <p className="truncate text-xs text-muted-foreground">
            #{row.original.user.id} · {row.original.user.email}
          </p>
        </div>
      ),
    },
    {
      id: "link",
      header: "Link",
      cell: ({ row }) => (
        <div className="max-w-52">
          <p className="truncate font-medium">{row.original.link.title}</p>
          <p className="truncate text-xs text-muted-foreground">
            #{row.original.link.id} · /{row.original.link.slug}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "ipAddress",
      header: "IP address",
      cell: ({ row }) => (
        <code className="whitespace-nowrap text-xs">
          {row.original.ipAddress || "—"}
        </code>
      ),
    },
    {
      accessorKey: "country",
      header: "Quốc gia",
      cell: ({ row }) => row.original.country || "ZZ",
    },
    {
      accessorKey: "deviceLabel",
      header: "Thiết bị",
    },
    {
      accessorKey: "revenue",
      header: "Revenue",
      cell: ({ row }) => (
        <span className="whitespace-nowrap font-medium tabular-nums">
          {formatMoney(row.original.revenue)}
        </span>
      ),
    },
    {
      accessorKey: "isEarn",
      header: "is_earn",
      cell: ({ row }) =>
        row.original.isEarn ? (
          <Badge variant="outline" className="text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 /> Có
          </Badge>
        ) : (
          <Badge variant="secondary">
            <XCircle /> Không
          </Badge>
        ),
    },
    {
      id: "detectionStatus",
      header: "Detection",
      cell: ({ row }) => <DetectionBadge log={row.original} />,
    },
    {
      accessorKey: "rejectReasonMask",
      header: "Reject reason",
      cell: ({ row }) => (
        <div className="max-w-52 text-xs">
          {row.original.rejectReasons[0] || "Không có"}
          {row.original.rejectReasons.length > 1 ? (
            <span className="text-muted-foreground">
              {` +${row.original.rejectReasons.length - 1}`}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      accessorKey: "riskScore",
      header: "Risk score",
      cell: ({ row }) =>
        row.original.riskScore === null ? (
          <span className="text-xs text-muted-foreground">On-demand</span>
        ) : (
          row.original.riskScore
        ),
    },
    {
      id: "review",
      header: "Review",
      cell: ({ row }) => <ReviewBadge status={row.original.review?.status} />,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Xem access log ${row.original.id}`}
          onClick={() => onView(row.original)}
        >
          <Eye />
        </Button>
      ),
      enableHiding: false,
    },
  ];
}

export function DetectionBadge({ log }: { log: AdminAccessLog }) {
  if (log.detectionStatus === "rejected") {
    return (
      <Badge variant="destructive">
        <XCircle /> Bị từ chối
      </Badge>
    );
  }
  if (log.detectionStatus === "suspicious") {
    return (
      <Badge variant="outline" className="text-amber-700 dark:text-amber-400">
        <ShieldAlert /> Đáng ngờ
      </Badge>
    );
  }
  return (
    <Badge variant="secondary">
      <CheckCircle2 /> Bình thường
    </Badge>
  );
}

export function ReviewBadge({ status }: { status?: string }) {
  const labels: Record<string, string> = {
    safe: "An toàn",
    suspicious: "Đáng ngờ",
    follow_up: "Theo dõi thêm",
  };
  return (
    <Badge variant={status === "suspicious" ? "destructive" : "outline"}>
      {status ? labels[status] || status : "Chưa review"}
    </Badge>
  );
}

export function formatMoney(value: string | number) {
  const amount = Number(value);
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 6,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short" }).format(
    new Date(value),
  );
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { timeStyle: "medium" }).format(
    new Date(value),
  );
}
