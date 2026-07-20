"use client";

import * as React from "react";
import { toast } from "sonner";

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
import { deleteAdminPages } from "@/features/admin-pages/api/pages.client";
import type { AdminPageListItem } from "@/features/admin-pages/types";

export function PageDeleteDialog({
  pages,
  onOpenChange,
  onSuccess,
}: {
  pages: AdminPageListItem[];
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [deleting, setDeleting] = React.useState(false);

  async function remove() {
    if (!pages.length) return;
    setDeleting(true);
    try {
      const result = await deleteAdminPages(pages.map((page) => page.id));
      toast.success(`Đã xóa ${result.deleted} trang.`);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể xóa trang.",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AlertDialog
      open={pages.length > 0}
      onOpenChange={(open) => !deleting && onOpenChange(open)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa {pages.length} trang?</AlertDialogTitle>
          <AlertDialogDescription>
            Trang sẽ bị ẩn khỏi danh sách và không còn truy cập được. Thao tác
            này dùng cơ chế xóa mềm để bảo toàn dữ liệu.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Hủy</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleting}
            onClick={() => void remove()}
          >
            {deleting ? "Đang xóa..." : "Xóa trang"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
