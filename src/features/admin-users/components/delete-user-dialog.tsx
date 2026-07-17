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
import { deleteAdminUser } from "@/features/admin-users/api/users.client";
import type { AdminUser } from "@/features/admin-users/types";

export function DeleteUserDialog({
  user,
  onOpenChange,
  onSuccess,
}: {
  user: AdminUser | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [deleting, setDeleting] = React.useState(false);

  async function remove() {
    if (!user) return;
    setDeleting(true);
    try {
      await deleteAdminUser(user.id);
      toast.success("Đã xóa người dùng.");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể xóa người dùng.",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AlertDialog
      open={Boolean(user)}
      onOpenChange={(open) => !deleting && onOpenChange(open)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa người dùng?</AlertDialogTitle>
          <AlertDialogDescription>
            Tài khoản <strong className="text-foreground">{user?.email}</strong>{" "}
            sẽ bị xóa vĩnh viễn. Người dùng đang sở hữu nội dung sẽ không thể
            xóa.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Hủy</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleting}
            onClick={() => void remove()}
          >
            {deleting ? "Đang xóa..." : "Xóa người dùng"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
