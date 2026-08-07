"use client";

import { Check, Copy, Landmark } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { BioBankDetailsBlockDto, BioDividerBlockDto } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const dividerSpacing = { sm: "py-1", md: "py-3", lg: "py-5" } as const;
const dividerStyle = { solid: "border-solid", dashed: "border-dashed", dotted: "border-dotted" } as const;

export function DividerRenderer({ block }: { block: BioDividerBlockDto }) {
  if (!block.enabled) return null;
  const line = <span aria-hidden className={cn("h-0 min-w-4 flex-1 border-t border-current opacity-35", dividerStyle[block.style])} />;
  return <div className={cn("flex items-center gap-3 text-[color:var(--bio-muted-text,var(--muted-foreground))]", dividerSpacing[block.spacing])} role="separator" aria-label={block.showLabel && block.label ? block.label : "Dấu phân cách"}>{line}{block.showLabel && block.label ? <span className="max-w-[70%] truncate text-xs font-medium">{block.label}</span> : null}{block.showLabel && block.label ? line : null}</div>;
}

export function BankDetailsRenderer({ block }: { block: BioBankDetailsBlockDto }) {
  const [copied, setCopied] = useState(false);
  if (!block.enabled || (!block.bankName && !block.accountName && !block.accountNumber)) return null;

  async function copyAccountNumber() {
    if (!block.accountNumber) return;
    try {
      await navigator.clipboard.writeText(block.accountNumber);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Không thể sao chép số tài khoản.");
    }
  }

  const rows = [
    ["Ngân hàng", block.bankName],
    ["Chủ tài khoản", block.accountName],
    ["Số tài khoản", block.accountNumber],
    ["Chi nhánh", block.branch],
  ].filter((row): row is [string, string] => Boolean(row[1]));

  return (
    <section className="overflow-hidden rounded-2xl border border-[color:var(--bio-section-border,var(--border))] bg-[color:var(--bio-section-bg,var(--card))] text-[color:var(--bio-text,var(--card-foreground))] shadow-sm" aria-label={block.title || "Thông tin ngân hàng"}>
      <div className="flex items-center gap-3 border-b border-[color:var(--bio-section-border,var(--border))] px-4 py-3.5"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-black/5 text-[color:var(--bio-muted-text,var(--muted-foreground))]"><Landmark className="size-[18px]" /></span><h2 className="min-w-0 truncate text-sm font-semibold">{block.title || "Thông tin ngân hàng"}</h2></div>
      <dl className="divide-y divide-[color:var(--bio-section-border,var(--border))] px-4">
        {rows.map(([label, value]) => <div key={label} className="grid gap-1 py-3 sm:grid-cols-[110px_minmax(0,1fr)] sm:gap-3"><dt className="text-xs text-[color:var(--bio-muted-text,var(--muted-foreground))]">{label}</dt><dd className={cn("min-w-0 break-words text-sm font-medium", label === "Số tài khoản" && "font-mono tracking-wide")}>{value}</dd></div>)}
      </dl>
      {block.note ? <p className="border-t border-[color:var(--bio-section-border,var(--border))] px-4 py-3 text-xs leading-5 text-[color:var(--bio-muted-text,var(--muted-foreground))]">{block.note}</p> : null}
      {block.showCopyButton && block.accountNumber ? <div className="border-t border-[color:var(--bio-section-border,var(--border))] bg-black/5 p-3"><Button type="button" variant="outline" size="sm" className="w-full" onClick={() => void copyAccountNumber()}>{copied ? <Check /> : <Copy />}{copied ? "Đã sao chép" : "Sao chép số tài khoản"}</Button></div> : null}
    </section>
  );
}
