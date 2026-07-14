"use client"

import { useId, type ChangeEvent, type ReactNode } from "react"
import { FileImage, FileText, FileVideo, Loader2, UploadCloud } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { ManagedFileDto } from "@/lib/api-client"

type FilePickerLabels = {
  action: string
  close: string
  empty: string
  loading: string
  name: string
  select: string
  size: string
  uploaded: string
}

type FilePickerUpload = {
  accept?: string
  isUploading: boolean
  label: string
  uploadingLabel: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
}

type FilePickerCredenzaProps = {
  description?: string
  error?: string
  files: ManagedFileDto[]
  footer?: ReactNode
  isLoading: boolean
  labels: FilePickerLabels
  onOpenChange: (open: boolean) => void
  onSelect: (file: ManagedFileDto) => void
  open: boolean
  selectedFileId?: string
  title: string
  upload?: FilePickerUpload
}

function FileTypeIcon({ file }: { file: ManagedFileDto }) {
  const className = "size-4"

  if (file.mimeType.startsWith("image/")) {
    return <FileImage className={className} aria-hidden />
  }

  if (file.mimeType.startsWith("video/")) {
    return <FileVideo className={className} aria-hidden />
  }

  return <FileText className={className} aria-hidden />
}

function formatFileDate(date: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date))
}

export function FilePickerCredenza({
  description,
  error,
  files,
  footer,
  isLoading,
  labels,
  onOpenChange,
  onSelect,
  open,
  selectedFileId,
  title,
  upload,
}: FilePickerCredenzaProps) {
  const inputId = useId()

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaContent className="sm:max-w-4xl">
        <CredenzaHeader className="border-b border-slate-200">
          <CredenzaTitle>{title}</CredenzaTitle>
          {description ? <CredenzaDescription>{description}</CredenzaDescription> : null}
        </CredenzaHeader>

        <CredenzaBody className="space-y-4">
          {upload ? (
            <label className="inline-flex cursor-pointer">
              <Button asChild disabled={upload.isUploading} className="h-10 bg-slate-950 px-4 font-semibold hover:bg-slate-800">
                <span>
                  {upload.isUploading ? <Loader2 className="animate-spin" /> : <UploadCloud />}
                  {upload.isUploading ? upload.uploadingLabel : upload.label}
                </span>
              </Button>
              <input
                id={inputId}
                type="file"
                accept={upload.accept}
                className="sr-only"
                disabled={upload.isUploading}
                onChange={upload.onChange}
              />
            </label>
          ) : null}

          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <Table className="min-w-[620px]">
              <TableHeader className="bg-slate-50/80">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[52%] px-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {labels.name}
                  </TableHead>
                  <TableHead className="px-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {labels.size}
                  </TableHead>
                  <TableHead className="px-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {labels.uploaded}
                  </TableHead>
                  <TableHead className="px-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {labels.action}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-40 text-center text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="size-4 animate-spin" />
                        {labels.loading}
                      </span>
                    </TableCell>
                  </TableRow>
                ) : files.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-40 text-center text-sm text-muted-foreground">
                      {labels.empty}
                    </TableCell>
                  </TableRow>
                ) : (
                  files.map((file) => {
                    const isSelected = selectedFileId === file.id

                    return (
                      <TableRow key={file.id} data-state={isSelected ? "selected" : undefined} className="group">
                        <TableCell className="px-4 py-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600">
                              <FileTypeIcon file={file} />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-slate-900">{file.name}</p>
                              <p className="mt-0.5 truncate text-xs text-muted-foreground">/{file.alias}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 text-sm text-muted-foreground">{file.sizeLabel}</TableCell>
                        <TableCell className="px-4 text-sm text-muted-foreground">{formatFileDate(file.createdAt)}</TableCell>
                        <TableCell className="px-4 text-right">
                          <Button
                            type="button"
                            size="sm"
                            variant={isSelected ? "secondary" : "outline"}
                            onClick={() => onSelect(file)}
                          >
                            {labels.select}
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CredenzaBody>

        <CredenzaFooter className="flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>{footer}</div>
          <CredenzaClose asChild>
            <Button type="button" variant="outline">
              {labels.close}
            </Button>
          </CredenzaClose>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  )
}
