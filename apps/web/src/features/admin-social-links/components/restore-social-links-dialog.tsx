"use client"

import * as React from "react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { restoreAdminSocialLinks } from "@/features/admin-social-links/api/social-links.client"
import type { AdminSocialLink } from "@/features/admin-social-links/types"

export function RestoreSocialLinksDialog({
  links,
  onOpenChange,
  onSuccess,
}: {
  links: AdminSocialLink[]
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const [restoring, setRestoring] = React.useState(false)

  async function restore() {
    if (!links.length) return
    setRestoring(true)
    try {
      const result = await restoreAdminSocialLinks(
        links.map((link) => link.id),
      )
      toast.success(`Đã khôi phục ${result.restored} social link.`)
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể khôi phục link.",
      )
    } finally {
      setRestoring(false)
    }
  }

  return (
    <AlertDialog
      open={links.length > 0}
      onOpenChange={(open) => !restoring && onOpenChange(open)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Khôi phục {links.length} social link?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Link sẽ được khôi phục ở trạng thái không hoạt động để quản trị viên
            kiểm tra trước khi kích hoạt lại.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={restoring}>Hủy</AlertDialogCancel>
          <AlertDialogAction
            disabled={restoring}
            onClick={() => void restore()}
          >
            {restoring ? "Đang khôi phục..." : "Khôi phục"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
