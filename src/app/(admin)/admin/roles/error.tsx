"use client";

import { Button } from "@/components/ui/button";

export default function AdminRolesError({ reset }: { reset: () => void }) {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center gap-3 p-6 text-center">
      <h2 className="font-semibold text-lg">Không tải được phân quyền</h2>
      <p className="text-muted-foreground text-sm">
        Bạn không có quyền hoặc API phân quyền đang tạm thời không khả dụng.
      </p>
      <Button variant="outline" onClick={reset}>
        Thử lại
      </Button>
    </div>
  );
}
