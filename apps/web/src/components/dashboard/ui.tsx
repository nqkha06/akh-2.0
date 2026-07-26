import type { ComponentProps, ReactNode } from "react";
import { Bell, ChevronDown, Search, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button as ShadcnButton } from "@/components/ui/button";
import { Badge as ShadcnBadge } from "@/components/ui/badge";
import { Card as ShadcnCard } from "@/components/ui/card";
import { Skeleton as ShadcnSkeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { TablePagination } from "@/components/table-pagination";

import {
  ToolbarFilterDrawer,
  type ToolbarFilterField,
} from "@/components/dashboard/filter-drawer";

export function PageContainer({
  children,
  size = "default",
  className,
  ...props
}: ComponentProps<"div"> & {
  size?: "default" | "wide";
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full space-y-6",
        size === "wide" ? "max-w-[1440px]" : "max-w-[1280px]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
  eyebrow,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  eyebrow?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-[-0.035em] text-foreground">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action ? (
        <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          {action}
        </div>
      ) : null}
    </header>
  );
}

export function SoftCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <ShadcnCard
      className={cn(
        "rounded-xl border-border bg-card text-card-foreground shadow-none",
        className,
      )}
    >
      {children}
    </ShadcnCard>
  );
}

export function StatCard({
  label,
  value,
  detail,
  icon,
  tone = "blue",
}: {
  label: string;
  value: string;
  detail?: string;
  icon?: ReactNode;
  tone?: "blue" | "emerald" | "violet" | "amber" | "rose";
}) {
  const tones = {
    blue: "bg-primary/10 text-primary ring-primary/15",
    emerald: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/15 dark:text-emerald-300",
    violet: "bg-primary/10 text-primary ring-primary/15",
    amber: "bg-amber-500/10 text-amber-700 ring-amber-500/15 dark:text-amber-300",
    rose: "bg-destructive/10 text-destructive ring-destructive/15",
  };

  return (
    <SoftCard className="relative overflow-hidden p-4">
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-foreground sm:text-[1.7rem]">
            {value}
          </p>
          {detail ? (
            <p className="mt-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">{detail}</p>
          ) : null}
        </div>
        {icon ? (
          <span
            className={`grid size-9 shrink-0 place-items-center rounded-lg ring-1 ${tones[tone]}`}
          >
            {icon}
          </span>
        ) : null}
      </div>
    </SoftCard>
  );
}

export function Badge({
  children,
  tone = "blue",
}: {
  children: ReactNode;
  tone?: "blue" | "emerald" | "violet" | "amber" | "rose" | "slate";
}) {
  const tones = {
    blue: "bg-primary/10 text-primary ring-primary/15",
    emerald: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/15 dark:text-emerald-300",
    violet: "bg-primary/10 text-primary ring-primary/15",
    amber: "bg-amber-500/10 text-amber-700 ring-amber-500/15 dark:text-amber-300",
    rose: "bg-destructive/10 text-destructive ring-destructive/15",
    slate: "bg-muted text-muted-foreground ring-border",
  };

  return (
    <ShadcnBadge className={cn("border-0 font-medium", tones[tone])}>
      {children}
    </ShadcnBadge>
  );
}

export function AppButton({
  children,
  variant = "primary",
  className = "",
  ...props
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  className?: string;
} & Omit<ComponentProps<typeof ShadcnButton>, "variant" | "children" | "className">) {
  const variants = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "border-border bg-background text-foreground hover:bg-muted",
    ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
    danger: "bg-destructive text-white hover:bg-destructive/90",
  };

  return (
    <ShadcnButton
      {...props}
      variant={variant === "secondary" ? "outline" : variant === "ghost" ? "ghost" : variant === "danger" ? "destructive" : "default"}
      size="lg"
      className={cn("h-10 rounded-lg px-4 text-sm font-medium", variants[variant], className)}
    >
      {children}
    </ShadcnButton>
  );
}

export function Toolbar({
  placeholder = "Tìm kiếm...",
  filterFields,
  filterTitle,
  filterDescription,
  filterButtonLabel,
}: {
  placeholder?: string;
  filterFields?: ToolbarFilterField[];
  filterTitle?: string;
  filterDescription?: string;
  filterButtonLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex h-10 w-full items-center gap-2 rounded-lg border border-border bg-background px-3 sm:max-w-sm">
        <Search size={16} className="text-muted-foreground" />
        <Input
          className="h-8 w-full border-0 bg-transparent px-0 text-sm shadow-none outline-none focus-visible:ring-0"
          placeholder={placeholder}
        />
      </div>
      <ToolbarFilterDrawer
        fields={filterFields}
        title={filterTitle}
        description={filterDescription}
        buttonLabel={filterButtonLabel}
      />
    </div>
  );
}

export function TableShell({
  headers,
  rows,
}: {
  headers: string[];
  rows: ReactNode;
}) {
  return (
    <SoftCard className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-left text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
              {headers.map((header) => (
                <th key={header} className="px-4 py-3 sm:px-5">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm text-foreground">
            {rows}
          </tbody>
        </table>
      </div>
    </SoftCard>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <SoftCard className="grid min-h-64 place-items-center p-6 text-center sm:p-8">
      <div className="max-w-sm">
        <div className="mx-auto mb-4 grid size-12 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
          <Sparkles size={24} />
        </div>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
        {action ? <div className="mt-5">{action}</div> : null}
      </div>
    </SoftCard>
  );
}

export function ProgressBar({
  value,
  tone = "blue",
}: {
  value: number;
  tone?: "blue" | "emerald" | "violet" | "amber";
}) {
  const tones = {
    blue: "bg-primary",
    emerald: "bg-emerald-600",
    violet: "bg-primary",
    amber: "bg-amber-500",
  };

  return (
    <div className="h-2 overflow-hidden rounded-full bg-muted">
      <div
        className={`h-full rounded-full ${tones[tone]}`}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <SoftCard className={className}>{children}</SoftCard>;
}

export function Button({
  children,
  variant = "primary",
  className = "",
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  className?: string;
}) {
  return (
    <AppButton variant={variant} className={className}>
      {children}
    </AppButton>
  );
}

export function DataTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: ReactNode;
}) {
  return <TableShell headers={headers} rows={rows} />;
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <ShadcnSkeleton className={cn("rounded-lg", className)} />;
}

export function Pagination(props: ComponentProps<typeof TablePagination>) {
  return <TablePagination {...props} />;
}

export function TabPills({
  items,
  active = 0,
}: {
  items: string[];
  active?: number;
}) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-muted/20 p-1">
      {items.map((item, index) => (
        <button
          key={item}
          className={`h-9 rounded-md px-3 text-sm font-medium transition-colors ${
            active === index ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

export function DropdownFilter({ label = "Trạng thái" }: { label?: string }) {
  return (
    <button className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
      {label}
      <ChevronDown size={16} />
    </button>
  );
}

export function ToastPreview({
  title = "Đã lưu thay đổi",
  description = "Thao tác đã được xử lý thành công.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex max-w-sm items-start gap-3 rounded-xl border border-border bg-card p-4">
      <span className="grid size-9 place-items-center rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
        <Bell size={16} />
      </span>
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}
