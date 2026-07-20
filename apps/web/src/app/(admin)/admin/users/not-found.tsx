import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function AdminUserNotFound() {
  return (
    <main className="grid min-h-80 flex-1 place-items-center p-6 text-center">
        <div>
          <h1 className="text-xl font-semibold">User không tồn tại</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Tài khoản có thể đã bị xóa hoặc ID không hợp lệ.
          </p>
          <Button className="mt-5" asChild>
            <Link href="/admin/users">Quay lại danh sách</Link>
          </Button>
        </div>
      </main>
  );
}
