"use client"

import { useId, useState, type FormEvent } from "react"
import { Loader2 } from "lucide-react"

import { FileTypeIcon } from "@/components/file-type-icon"
import { Button } from "@/components/ui/button"
import {
  Credenza,
  CredenzaBody,
  CredenzaClose,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ManagedFileDto } from "@/lib/api-client"

type FileRenameCredenzaProps = {
  file: ManagedFileDto | null
  open: boolean
  saving?: boolean
  onOpenChange: (open: boolean) => void
  onRename: (file: ManagedFileDto, name: string) => Promise<boolean>
}

export function FileRenameCredenza({
  file,
  ...props
}: FileRenameCredenzaProps) {
  if (!file) return null

  return (
    <FileRenameCredenzaContent
      key={file.id}
      file={file}
      {...props}
    />
  )
}

function FileRenameCredenzaContent({
  file,
  open,
  saving = false,
  onOpenChange,
  onRename,
}: Omit<FileRenameCredenzaProps, "file"> & { file: ManagedFileDto }) {
  const inputId = useId()
  const [name, setName] = useState(file.name)
  const [error, setError] = useState("")

  const handleOpenChange = (nextOpen: boolean) => {
    if (saving) return
    onOpenChange(nextOpen)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const normalizedName = name.trim().replace(/\s+/g, " ")
    if (!normalizedName) {
      setError("Tên file không được để trống.")
      return
    }
    if (normalizedName.length > 255) {
      setError("Tên file không được vượt quá 255 ký tự.")
      return
    }
    if (normalizedName === file.name) {
      onOpenChange(false)
      return
    }

    setError("")
    const renamed = await onRename(file, normalizedName)
    if (renamed) onOpenChange(false)
  }

  return (
    <Credenza open={open} onOpenChange={handleOpenChange}>
      <CredenzaContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <CredenzaHeader className="border-b border-border">
            <CredenzaTitle>Đổi tên file</CredenzaTitle>
            <CredenzaDescription>
              Thay đổi tên hiển thị. File vật lý và đường dẫn tải xuống không bị
              thay đổi.
            </CredenzaDescription>
          </CredenzaHeader>

          <CredenzaBody className="space-y-4 pt-5">
            <div className="flex min-w-0 items-center gap-3 rounded-lg border border-border bg-muted/20 p-3">
              <FileTypeIcon file={file} />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {file.name}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {file.mimeType}
                </p>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor={inputId}>Tên file mới</Label>
              <Input
                id={inputId}
                value={name}
                maxLength={255}
                autoFocus
                disabled={saving}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `${inputId}-error` : undefined}
                onChange={(event) => {
                  setName(event.target.value)
                  if (error) setError("")
                }}
              />
              {error ? (
                <p
                  id={`${inputId}-error`}
                  className="text-sm text-destructive"
                >
                  {error}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Tối đa 255 ký tự.
                </p>
              )}
            </div>
          </CredenzaBody>

          <CredenzaFooter className="border-border bg-background">
            <CredenzaClose asChild>
              <Button type="button" variant="outline" disabled={saving}>
                Hủy
              </Button>
            </CredenzaClose>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? (
                <Loader2 className="animate-spin motion-reduce:animate-none" />
              ) : null}
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </CredenzaFooter>
        </form>
      </CredenzaContent>
    </Credenza>
  )
}
