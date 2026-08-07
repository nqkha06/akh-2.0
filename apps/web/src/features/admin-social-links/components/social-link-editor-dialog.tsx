"use client"

import * as React from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { updateAdminSocialLink } from "@/features/admin-social-links/api/social-links.client"
import type {
  AdminSocialLink,
  AdminSocialLinkPayload,
} from "@/features/admin-social-links/types"

export function SocialLinkEditorDialog({
  link,
  onOpenChange,
  onSuccess,
}: {
  link: AdminSocialLink | null
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const [values, setValues] = React.useState<AdminSocialLinkPayload>(() =>
    initialValues(link),
  )
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState("")

  if (!link) return null

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!link) return
    if (
      link.destinationType === "url" &&
      !/^https?:\/\/\\S+$/i.test(values.destinationUrl ?? "")
    ) {
      setError("Destination URL phải bắt đầu bằng http:// hoặc https://.")
      return
    }

    setSaving(true)
    setError("")
    try {
      await updateAdminSocialLink(link.id, {
        title: values.title.trim(),
        subtitle: values.subtitle.trim(),
        status: values.status,
        ...(link.destinationType === "url"
          ? { destinationUrl: values.destinationUrl?.trim() }
          : {}),
      })
      toast.success("Đã cập nhật social link.")
      onOpenChange(false)
      onSuccess()
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Không thể cập nhật social link.",
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => !saving && onOpenChange(open)}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa social link</DialogTitle>
          <DialogDescription>
            Cập nhật nội dung quản trị cho <strong>{link.slug}</strong>. Chủ sở
            hữu và alias không thể thay đổi tại đây.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor="admin-link-title">
              Tiêu đề (không bắt buộc)
            </Label>
            <Input
              id="admin-link-title"
              value={values.title}
              maxLength={160}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="admin-link-subtitle">Mô tả</Label>
            <Textarea
              id="admin-link-subtitle"
              value={values.subtitle}
              maxLength={500}
              rows={4}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  subtitle: event.target.value,
                }))
              }
            />
          </div>
          {link.destinationType === "url" ? (
            <div className="grid gap-2">
              <Label htmlFor="admin-link-destination">Destination URL</Label>
              <Input
                id="admin-link-destination"
                type="url"
                value={values.destinationUrl ?? ""}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    destinationUrl: event.target.value,
                  }))
                }
              />
            </div>
          ) : (
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
              Destination loại <strong>{link.destinationType}</strong> được quản
              lý từ tài nguyên nguồn và không chỉnh trực tiếp tại đây.
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="admin-link-status">Trạng thái</Label>
            <Select
              value={values.status}
              onValueChange={(status: AdminSocialLinkPayload["status"]) =>
                setValues((current) => ({ ...current, status }))
              }
            >
              <SelectTrigger id="admin-link-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Hoạt động</SelectItem>
                <SelectItem value="inactive">Không hoạt động</SelectItem>
                <SelectItem value="paused">Tạm dừng</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {error ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-destructive text-sm">
              {error}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function initialValues(
  link: AdminSocialLink | null,
): AdminSocialLinkPayload {
  return {
    title: link?.title ?? "",
    subtitle: link?.subtitle ?? "",
    status: link?.status ?? "inactive",
    destinationUrl: link?.destinationUrl ?? "",
  }
}
