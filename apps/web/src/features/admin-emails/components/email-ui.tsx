import type { ReactNode } from "react";
import { AlertTriangle, CircleCheck, CircleDashed, CircleX, Inbox } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function EmailStatusBadge({
  status,
  label,
  className,
}: {
  status: string;
  label?: string;
  className?: string;
}) {
  const positive = ["configured", "verified", "active", "delivered", "sent", "opened", "clicked", "healthy"].includes(status);
  const warning = ["pending", "pending_verification", "incomplete", "draft", "queued", "sending", "paused", "bounced"].includes(status);
  const negative = ["failed", "unavailable", "disabled", "complained", "suppressed", "cancelled", "warning"].includes(status);
  const Icon = positive ? CircleCheck : negative ? CircleX : warning ? CircleDashed : CircleDashed;
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 whitespace-nowrap font-medium",
        positive && "border-success/25 bg-success/10 text-success",
        warning && "border-warning/25 bg-warning/10 text-warning",
        negative && "border-destructive/25 bg-destructive/10 text-destructive",
        className,
      )}
    >
      <Icon className="size-3" />
      {label || status}
    </Badge>
  );
}

export function EmailEmptyState({
  title,
  description,
  action,
  warning = false,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  warning?: boolean;
}) {
  const Icon = warning ? AlertTriangle : Inbox;
  return (
    <div className="flex min-h-52 flex-col items-center justify-center px-6 py-10 text-center">
      <div className="mb-3 flex size-10 items-center justify-center rounded-lg border bg-muted/40 text-muted-foreground">
        <Icon className="size-5" />
      </div>
      <p className="font-medium">{title}</p>
      <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function EmailMetricCard({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "neutral" | "positive" | "warning" | "negative";
}) {
  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <span
            className={cn(
              "size-2 rounded-full bg-muted-foreground/30",
              tone === "positive" && "bg-success",
              tone === "warning" && "bg-warning",
              tone === "negative" && "bg-destructive",
            )}
          />
        </div>
        <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] tabular-nums">{value}</p>
        {hint ? <p className="mt-1 truncate text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

export function formatEmailDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}
