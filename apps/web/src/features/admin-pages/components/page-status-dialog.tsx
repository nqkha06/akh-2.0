"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { PageStatus } from "@/features/admin-pages/types";

const copy: Record<
  PageStatus,
  { action: string; description: string }
> = {
  PUBLISHED: {
    action: "Xuất bản",
    description:
      "Trang sẽ có thể được truy cập công khai ngay sau khi xuất bản.",
  },
  DRAFT: {
    action: "Chuyển về nháp",
    description:
      "Trang sẽ ngừng hiển thị public nhưng vẫn có thể xem qua preview quản trị.",
  },
  ARCHIVED: {
    action: "Lưu trữ",
    description:
      "Trang sẽ ngừng hiển thị public và không thể chỉnh sửa cho đến khi được khôi phục.",
  },
};

export function PageStatusDialog({
  count,
  status,
  busy,
  onConfirm,
  onOpenChange,
}: {
  count: number;
  status: PageStatus | null;
  busy: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
}) {
  const config = status ? copy[status] : null;
  return (
    <AlertDialog
      open={Boolean(config && count)}
      onOpenChange={(open) => !busy && onOpenChange(open)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {config?.action} {count} trang?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {config?.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Hủy</AlertDialogCancel>
          <AlertDialogAction
            disabled={busy}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
          >
            {busy ? "Đang cập nhật..." : config?.action}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
