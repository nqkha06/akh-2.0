import Link from "next/link";

import { AdminHeader } from "@/components/admin/admin-header";
import { Button } from "@/components/ui/button";

export default function MonetizationLevelNotFound() {
  return (
    <>
      <AdminHeader title="Monetization Levels" />
      <main className="grid min-w-0 flex-1 place-items-center p-6">
        <div className="max-w-md rounded-xl border bg-card p-6 text-center shadow-sm">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
            404 · Level not found
          </p>
          <h1 className="mt-3 text-xl font-semibold tracking-[-0.03em]">
            Không tìm thấy cấp độ kiếm tiền
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Cấp độ có thể đã bị xóa hoặc đường dẫn không còn hợp lệ.
          </p>
          <Button asChild className="mt-5">
            <Link href="/admin/monetization-levels">Quay lại danh sách</Link>
          </Button>
        </div>
      </main>
    </>
  );
}
