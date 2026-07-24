"use client";

import { Button } from "@/components/ui/button";

export default function AdminSettingsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-w-0 flex-1 px-4 py-8 lg:px-6">
      <div className="mx-auto w-full max-w-[1240px] rounded-xl border border-destructive/30 bg-destructive/5 p-6">
        <h1 className="font-semibold">Không thể tải cấu hình hệ thống</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Kiểm tra kết nối API hoặc thử tải lại màn hình.
        </p>
        <Button className="mt-4" onClick={reset}>
          Thử lại
        </Button>
      </div>
    </main>
  );
}
