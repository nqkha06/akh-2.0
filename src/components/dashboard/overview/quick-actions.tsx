import Link from "next/link";
import { ArrowUpRight, FileUp, Link2, LockKeyhole, UserRound } from "lucide-react";

import type { QuickActionItem } from "./types";

const actionIcons: Record<QuickActionItem["kind"], typeof Link2> = {
  social: Link2,
  file: FileUp,
  bio: UserRound,
  unlock: LockKeyhole,
};

export function QuickActions({ actions }: { actions: QuickActionItem[] }) {
  return (
    <section className="min-w-0 rounded-xl border border-border bg-card" aria-labelledby="quick-actions-title">
      <div className="border-b border-border px-5 py-4">
        <h2 id="quick-actions-title" className="text-base font-semibold tracking-tight text-card-foreground">Bắt đầu nhanh</h2>
        <p className="mt-1 text-sm text-muted-foreground">Tạo nội dung mới từ một luồng có sẵn.</p>
      </div>
      <div className="divide-y divide-border">
        {actions.map((action) => {
          const Icon = actionIcons[action.kind];
          return (
            <Link key={action.id} href={action.href} className="group flex min-h-16 items-center gap-3 px-5 py-3 transition-colors duration-150 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring motion-reduce:transition-none">
              <span className="grid size-8 shrink-0 place-items-center rounded-md border border-border bg-background text-muted-foreground transition-colors group-hover:text-primary">
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-foreground">{action.label}</span>
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">{action.description}</span>
              </span>
              {action.shortcut ? <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 font-sans text-[10px] text-muted-foreground sm:block">{action.shortcut}</kbd> : null}
              <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
