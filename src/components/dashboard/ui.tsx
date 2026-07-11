import type { ReactNode } from "react";
import { Bell, ChevronDown, ChevronRight, Search, Sparkles } from "lucide-react";

import {
  ToolbarFilterDrawer,
  type ToolbarFilterField,
} from "@/components/dashboard/filter-drawer";

export function PageHeader({
  title,
  description,
  action,
  eyebrow,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="mb-4 pb-4">
      <nav className="mb-3 flex items-center gap-1 text-xs font-semibold text-slate-400">
        <span className="hover:text-slate-600">{eyebrow ?? "Home"}</span>
        <ChevronRight size={14} className="text-slate-300" />
        <span className="text-slate-600">{title}</span>
      </nav>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
            {title}
          </h1>

          <p className="mt-1.5 max-w-xl text-sm font-medium leading-6 text-slate-500">
            {description}
          </p>
        </div>

        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
    // <div className="mb-4 border-b border-slate-200 pb-4">
    //   <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
    //     <div className="max-w-2xl">
    //       <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-blue-600">
    //         <Sparkles size={12} />
    //         {eyebrow ?? "Rekonise"}
    //       </div>
    //       <h1 className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
    //         {title}
    //       </h1>
    //       <p className="mt-1.5 max-w-xl text-sm font-medium leading-6 text-slate-500">
    //         {description}
    //       </p>
    //     </div>
    //     {action ? <div className="shrink-0">{action}</div> : null}
    //   </div>
    // </div>
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
    <article
      className={`rounded-xl border border-slate-200 bg-white shadow-[0_6px_18px_rgba(15,23,42,0.05)] transition duration-200 hover:border-slate-300 hover:shadow-[0_10px_24px_rgba(15,23,42,0.07)] ${className}`}
    >
      {children}
    </article>
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
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    violet: "bg-violet-50 text-violet-700 ring-violet-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    rose: "bg-rose-50 text-rose-700 ring-rose-100",
  };

  return (
    <SoftCard className="relative overflow-hidden p-4">
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-[1.7rem]">
            {value}
          </p>
          {detail ? (
            <p className="mt-2 text-xs font-bold text-emerald-600">{detail}</p>
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
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    violet: "bg-violet-50 text-violet-700 ring-violet-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    rose: "bg-rose-50 text-rose-700 ring-rose-100",
    slate: "bg-slate-100 text-slate-600 ring-slate-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function AppButton({
  children,
  variant = "primary",
  className = "",
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  className?: string;
}) {
  const variants = {
    primary:
      "bg-blue-600 text-white shadow-[0_6px_16px_rgba(37,99,235,0.16)] hover:bg-blue-700 hover:shadow-[0_8px_20px_rgba(37,99,235,0.18)]",
    secondary:
      "border border-slate-200 bg-white text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:border-slate-300 hover:bg-white",
    ghost: "text-slate-600 hover:bg-white hover:text-slate-950",
    danger:
      "bg-rose-600 text-white shadow-[0_6px_16px_rgba(244,63,94,0.16)] hover:bg-rose-700",
  };

  return (
    <button
      className={`inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/70 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
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
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white/90 p-3 shadow-[0_8px_24px_rgba(15,23,42,0.06)] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex h-11 w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 sm:max-w-sm">
        <Search size={16} className="text-slate-400" />
        <input
          className="w-full bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
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
            <tr className="border-b border-slate-100 bg-slate-50/70 text-left text-xs font-bold uppercase tracking-[0.08em] text-slate-400">
              {headers.map((header) => (
                <th key={header} className="px-5 py-4">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-700">
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
    <SoftCard className="grid min-h-64 place-items-center p-8 text-center">
      <div className="max-w-sm">
        <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
          <Sparkles size={24} />
        </div>
        <h3 className="text-lg font-bold text-slate-950">{title}</h3>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
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
    blue: "bg-blue-600",
    emerald: "bg-emerald-600",
    violet: "bg-violet-600",
    amber: "bg-amber-500",
  };

  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
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
  return (
    <div
      className={`animate-pulse rounded-lg bg-slate-100 ${className}`}
    />
  );
}

export function Pagination() {
  return (
    <div className="flex items-center justify-end gap-2">
      {["Trước", "1", "2", "3", "Sau"].map((item, index) => (
        <button
          key={item}
          className={`h-9 rounded-xl px-3 text-sm font-bold transition ${
            index === 1
              ? "bg-slate-950 text-white"
              : "border border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-950"
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

export function TabPills({
  items,
  active = 0,
}: {
  items: string[];
  active?: number;
}) {
  return (
    <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-[0_4px_10px_rgba(15,23,42,0.06)]">
      {items.map((item, index) => (
        <button
          key={item}
          className={`h-9 rounded-xl px-3 text-sm font-bold transition ${
            active === index ? "bg-slate-950 text-white" : "text-slate-500"
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
    <button className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 shadow-[0_4px_10px_rgba(15,23,42,0.06)] transition hover:border-slate-300 hover:text-slate-950">
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
    <div className="flex max-w-sm items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
      <span className="grid size-9 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
        <Bell size={16} />
      </span>
      <div>
        <p className="text-sm font-bold text-slate-950">{title}</p>
        <p className="mt-1 text-xs font-semibold text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}
