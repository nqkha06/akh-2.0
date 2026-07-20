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
import { deleteAdminSocialLinks } from "@/features/admin-social-links/api/social-links.client"
import type { AdminSocialLink } from "@/features/admin-social-links/types"

export function DeleteSocialLinksDialog({
  links,
  onOpenChange,
  onSuccess,
}: {
  links: AdminSocialLink[]
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const [deleting, setDeleting] = React.useState(false)

  async function remove() {
    if (!links.length) return
    setDeleting(true)
    try {
      const result = await deleteAdminSocialLinks(
        links.map((link) => link.id),
      )
      toast.success(`Đã chuyển ${result.deleted} social link vào thùng rác.`)
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể xóa social link.",
      )
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AlertDialog
      open={links.length > 0}
      onOpenChange={(open) => !deleting && onOpenChange(open)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Chuyển {links.length} social link vào thùng rác?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Link công khai sẽ ngừng hoạt động. Dữ liệu chưa bị xóa vĩnh viễn và
            quản trị viên có thể khôi phục sau.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Hủy</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleting}
            onClick={() => void remove()}
          >
            {deleting ? "Đang xử lý..." : "Chuyển vào thùng rác"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
