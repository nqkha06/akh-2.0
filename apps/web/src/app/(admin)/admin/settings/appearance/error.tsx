"use client";

import { Button } from "@/components/ui/button";

export default function AppearanceSettingsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="px-4 py-8 lg:px-6">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
          <h1 className="font-semibold">Không thể tải cài đặt website</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Kiểm tra kết nối API hoặc thử tải lại màn hình.
          </p>
          <Button className="mt-4" onClick={reset}>Thử lại</Button>
        </div>
      </main>
  );
}
