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
import { deleteLoyaltyTier } from "@/features/admin-loyalty-tiers/api/loyalty-tiers.client";
import type { AdminLoyaltyTier } from "@/features/admin-loyalty-tiers/types";

export function DeleteLoyaltyTierDialog({
  tier,
  onOpenChange,
  onSuccess,
}: {
  tier: AdminLoyaltyTier | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [deleting, setDeleting] = React.useState(false);

  async function remove() {
    if (!tier) return;
    setDeleting(true);
    try {
      await deleteLoyaltyTier(tier.id);
      toast.success(`Đã xóa hạng “${tier.displayName}”.`);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xóa hạng.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AlertDialog open={Boolean(tier)} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa hạng Loyalty?</AlertDialogTitle>
          <AlertDialogDescription>
            Hạng “{tier?.displayName}” cùng toàn bộ bản dịch và quyền lợi sẽ bị
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
            {deleting ? "Đang xóa..." : "Xóa hạng"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
