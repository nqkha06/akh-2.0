import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function LoyaltyTierNotFound() {
  return (
    <main className="grid min-w-0 flex-1 place-items-center p-6">
      <div className="max-w-md rounded-xl border bg-card p-6 text-center shadow-sm">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">404 · Tier not found</p>
        <h1 className="mt-3 text-xl font-semibold tracking-tight">Không tìm thấy hạng Loyalty</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Hạng có thể đã bị xóa hoặc đường dẫn không còn hợp lệ.</p>
        <Button asChild className="mt-5"><Link href="/admin/loyalty">Quay lại danh sách</Link></Button>
      </div>
    </main>
  );
}
