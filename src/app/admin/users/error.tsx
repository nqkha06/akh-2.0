"use client";

import { Button } from "@/components/ui/button";

export default function AdminUsersError({ reset }: { reset: () => void }) {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center gap-3 p-6 text-center">
      <h2 className="font-semibold text-lg">Không tải được người dùng</h2>
      <p className="text-muted-foreground text-sm">
        Không thể kết nối đến API quản trị. Vui lòng thử lại.
      </p>
      <Button variant="outline" onClick={reset}>
        Thử lại
      </Button>
    </div>
  );
}
