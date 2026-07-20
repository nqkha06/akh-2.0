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
import { deleteMonetizationLevel } from "@/features/admin-monetization-levels/api/monetization-levels.client";
import type { AdminMonetizationLevel } from "@/features/admin-monetization-levels/types";

export function DeleteMonetizationLevelDialog({
  level,
  onOpenChange,
  onSuccess,
}: {
  level: AdminMonetizationLevel | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [deleting, setDeleting] = React.useState(false);

  async function remove() {
    if (!level) return;
    setDeleting(true);
    try {
      await deleteMonetizationLevel(level.id);
      toast.success(`Đã xóa cấp độ “${level.displayName}”.`);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể xóa cấp độ.",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AlertDialog open={Boolean(level)} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa cấp độ kiếm tiền?</AlertDialogTitle>
          <AlertDialogDescription>
            Cấp độ “{level?.displayName}” và toàn bộ bản dịch, route, rate sẽ bị
            xóa vĩnh viễn. Thao tác này không thể hoàn tác.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Hủy</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleting}
            onClick={(event) => {
              event.preventDefault();
              void remove();
            }}
          >
            {deleting ? "Đang xóa..." : "Xóa cấp độ"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
