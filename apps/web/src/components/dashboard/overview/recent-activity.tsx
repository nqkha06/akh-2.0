import Link from "next/link";
import { BadgeDollarSign, CheckCheck, ExternalLink, Link2, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useMemberCurrency } from "@/features/currencies/components/member-currency-provider";

import type { ActivityKind, RecentActivityItem } from "./types";

const activityIcons: Record<ActivityKind, typeof Link2> = {
  unlock: Link2,
  published: CheckCheck,
  payment: BadgeDollarSign,
  milestone: TrendingUp,
};

export function RecentActivity({ items }: { items: RecentActivityItem[] }) {
  const { formatCurrency } = useMemberCurrency();
  return (
    <section className="min-w-0 rounded-xl border border-border bg-card" aria-labelledby="activity-title">
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <h2 id="activity-title" className="text-base font-semibold tracking-tight text-card-foreground">Hoạt động gần đây</h2>
        <p className="mt-1 text-sm text-muted-foreground">Các thay đổi và cột mốc mới nhất trên tài khoản.</p>
      </div>
      <ol className="divide-y divide-border px-5 sm:px-6">
        {items.map((item) => {
          const Icon = activityIcons[item.kind];
          const content = (
            <>
              <span className="grid size-8 shrink-0 place-items-center rounded-md border border-border bg-muted/40 text-muted-foreground">
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm leading-5 text-foreground">
                  {item.kind === "payment" && item.amount !== undefined
                    ? `${item.content}: ${formatCurrency(item.amount, {
                        sourceCurrency: item.currency,
                      })}`
                    : item.content}
                </span>
                <time className="mt-1 block text-xs text-muted-foreground">{item.time}</time>
              </span>
              {item.href ? <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" /> : null}
            </>
          );

          return (
            <li key={item.id}>
              {item.href ? (
                <Link href={item.href} className="flex min-h-16 items-center gap-3 py-3.5 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">{content}</Link>
              ) : (
                <div className="flex min-h-16 items-center gap-3 py-3.5">{content}</div>
              )}
            </li>
          );
        })}
      </ol>
      <div className="border-t border-border px-5 py-3.5 sm:px-6">
        <Button variant="link" className="h-auto px-0 text-sm" asChild><Link href="/member/activity">Xem toàn bộ hoạt động</Link></Button>
      </div>
    </section>
  );
}
