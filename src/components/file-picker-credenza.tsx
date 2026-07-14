"use client"

import {
  useId,
  useMemo,
  useState,
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
} from "react"
import {
  Check,
  Eye,
  FileImage,
  FileText,
  FileVideo,
  FolderOpen,
  Loader2,
  Search,
  UploadCloud,
  X,
} from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { getFilePreviewUrl, type ManagedFileDto } from "@/lib/api-client"

export type FilePickerMode = "destination" | "cover" | "background"

type FileKind = "image" | "video" | "document" | "other"
type FileSort = "newest" | "oldest" | "name" | "size"

type FilePickerLabels = {
  action: string
  close: string
  empty: string
  loading: string
  name: string
  select: string
  size: string
  uploaded: string
  search?: string
  allTypes?: string
  images?: string
  videos?: string
  documents?: string
  other?: string
  newest?: string
  oldest?: string
  nameSort?: string
  sizeSort?: string
  noResults?: string
  clearSearch?: string
  preview?: string
  dragHint?: string
  browseHint?: string
  fileCount?: (count: number) => string
}

type FilePickerUpload = {
  accept?: string
  isUploading: boolean
  label: string
  uploadingLabel: string
  multiple?: boolean
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  onFiles?: (files: File[]) => void | Promise<void>
}

type FilePickerCredenzaProps = {
  description?: string
  error?: string
  files: ManagedFileDto[]
  footer?: ReactNode
  isLoading: boolean
  labels: FilePickerLabels
  mode?: FilePickerMode
  onOpenChange: (open: boolean) => void
  onSelect: (file: ManagedFileDto) => void
  open: boolean
  selectedFileId?: string
  title: string
  upload?: FilePickerUpload
}

function getFileKind(file: ManagedFileDto): FileKind {
  if (file.mimeType.startsWith("image/")) return "image"
  if (file.mimeType.startsWith("video/")) return "video"

  const documentMimeTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument",
    "application/vnd.ms-excel",
    "application/vnd.ms-powerpoint",
    "text/",
  ]

  return documentMimeTypes.some((mimeType) => file.mimeType.startsWith(mimeType))
    ? "document"
    : "other"
}

function FileTypeIcon({ file, className = "size-4" }: { file: ManagedFileDto; className?: string }) {
  const kind = getFileKind(file)

  if (kind === "image") return <FileImage className={className} aria-hidden />
  if (kind === "video") return <FileVideo className={className} aria-hidden />
  return <FileText className={className} aria-hidden />
}

function formatFileDate(date: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date))
}

function FilePreview({
  file,
  label,
  sizeLabel,
  uploadedLabel,
}: {
  file: ManagedFileDto
  label: string
  sizeLabel: string
  uploadedLabel: string
}) {
  const kind = getFileKind(file)
  const previewUrl = getFilePreviewUrl(file)

  return (
    <aside className="rounded-xl border border-border bg-muted/15 p-3" aria-label={label}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className="rounded-md border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
          {file.extension || kind}
        </span>
      </div>

      <div className="mt-3 grid aspect-[4/3] place-items-center overflow-hidden rounded-lg border border-border bg-background">
        {kind === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt={file.name} className="h-full w-full object-contain" />
        ) : kind === "video" ? (
          <video src={previewUrl} controls preload="metadata" className="h-full w-full object-contain" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <span className="grid size-12 place-items-center rounded-xl border border-border bg-muted/35">
              <FileTypeIcon file={file} className="size-6" />
            </span>
            <span className="text-xs">{file.extension?.toUpperCase() || "FILE"}</span>
          </div>
        )}
      </div>

      <div className="mt-3 min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
        <p className="mt-1 truncate text-xs text-muted-foreground">/{file.alias}</p>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3 text-xs">
        <div>
          <dt className="text-muted-foreground">{sizeLabel}</dt>
          <dd className="mt-0.5 font-medium text-foreground">{file.sizeLabel}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{uploadedLabel}</dt>
          <dd className="mt-0.5 font-medium text-foreground">{formatFileDate(file.createdAt)}</dd>
        </div>
      </dl>
    </aside>
  )
}

export function FilePickerCredenza({
  description,
  error,
  files,
  footer,
  isLoading,
  labels,
  mode = "destination",
  onOpenChange,
  onSelect,
  open,
  selectedFileId,
  title,
  upload,
}: FilePickerCredenzaProps) {
  const inputId = useId()
  const [query, setQuery] = useState("")
  const [kind, setKind] = useState<"all" | FileKind>("all")
  const [sort, setSort] = useState<FileSort>("newest")
  const [previewFileId, setPreviewFileId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const availableKinds = useMemo(() => {
    const kinds = new Set(files.map(getFileKind))
    return (["image", "video", "document", "other"] as const).filter((value) => kinds.has(value))
  }, [files])

  const filteredFiles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const result = files.filter((file) => {
      if (kind !== "all" && getFileKind(file) !== kind) return false
      if (!normalizedQuery) return true

      return [file.name, file.originalName, file.alias, file.extension, file.mimeType]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalizedQuery))
    })

    return [...result].sort((a, b) => {
      if (sort === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      if (sort === "name") return a.name.localeCompare(b.name)
      if (sort === "size") return b.size - a.size
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [files, kind, query, sort])

  const previewFile = files.find((file) => file.id === previewFileId)
  const modeLabel = mode === "cover" ? "Cover image" : mode === "background" ? "Background" : "Destination"
  const fileCount = labels.fileCount?.(filteredFiles.length) || `${filteredFiles.length} files`

  const typeLabels: Record<FileKind, string> = {
    image: labels.images || "Images",
    video: labels.videos || "Videos",
    document: labels.documents || "Documents",
    other: labels.other || "Other",
  }

  function handleDragOver(event: DragEvent<HTMLLabelElement>) {
    if (!upload?.onFiles || upload.isUploading) return
    event.preventDefault()
    event.dataTransfer.dropEffect = "copy"
    setIsDragging(true)
  }

  function handleOpenChange(nextOpen: boolean) {
    setIsDragging(false)
    if (nextOpen) setPreviewFileId(selectedFileId || null)
    onOpenChange(nextOpen)
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    if (!upload?.onFiles || upload.isUploading) return
    event.preventDefault()
    setIsDragging(false)

    const droppedFiles = Array.from(event.dataTransfer.files)
    const acceptedFiles = upload.multiple ? droppedFiles : droppedFiles.slice(0, 1)
    if (acceptedFiles.length > 0) void upload.onFiles(acceptedFiles)
  }

  const emptyContent = query || kind !== "all" ? (
    <div className="flex flex-col items-center px-4 py-10 text-center">
      <Search className="size-5 text-muted-foreground" aria-hidden />
      <p className="mt-3 text-sm font-medium text-foreground">{labels.noResults || "No matching files"}</p>
      <button
        type="button"
        onClick={() => {
          setQuery("")
          setKind("all")
        }}
        className="mt-2 text-xs font-medium text-primary hover:underline"
      >
        {labels.clearSearch || "Clear filters"}
      </button>
    </div>
  ) : (
    <div className="flex flex-col items-center px-4 py-10 text-center">
      <span className="grid size-10 place-items-center rounded-xl border border-border bg-muted/30 text-muted-foreground">
        <FolderOpen className="size-5" aria-hidden />
      </span>
      <p className="mt-3 max-w-xs text-sm text-muted-foreground">{labels.empty}</p>
    </div>
  )

  return (
    <Credenza open={open} onOpenChange={handleOpenChange}>
      <CredenzaContent className="bg-background sm:max-w-5xl">
        <CredenzaHeader className="border-b border-border bg-card">
          <div className="flex items-start justify-between gap-4 pr-8">
            <div>
              <div className="mb-1.5 flex items-center gap-2">
                <span className="rounded-md border border-border bg-muted/35 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {modeLabel}
                </span>
                <span className="text-xs text-muted-foreground">{fileCount}</span>
              </div>
              <CredenzaTitle className="text-base font-semibold tracking-[-0.01em]">{title}</CredenzaTitle>
              {description ? <CredenzaDescription className="mt-1">{description}</CredenzaDescription> : null}
            </div>
          </div>
        </CredenzaHeader>

        <CredenzaBody className="space-y-4 pt-4">
          {upload ? (
            <label
              htmlFor={inputId}
              onDragEnter={handleDragOver}
              onDragOver={handleDragOver}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`flex min-h-20 cursor-pointer items-center gap-3 rounded-xl border border-dashed px-4 py-3 transition-colors focus-within:ring-2 focus-within:ring-primary/40 ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border bg-muted/15 hover:border-primary/35 hover:bg-muted/25"
              } ${upload.isUploading ? "pointer-events-none opacity-70" : ""}`}
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-border bg-background text-muted-foreground">
                {upload.isUploading ? <Loader2 className="size-5 animate-spin" /> : <UploadCloud className="size-5" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-foreground">
                  {upload.isUploading ? upload.uploadingLabel : labels.dragHint || "Drop files here or browse"}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {labels.browseHint || upload.label}
                </span>
              </span>
              <span className="hidden h-8 items-center rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground sm:inline-flex">
                {upload.label}
              </span>
              <input
                id={inputId}
                type="file"
                accept={upload.accept}
                multiple={upload.multiple}
                className="sr-only"
                disabled={upload.isUploading}
                onChange={upload.onChange}
              />
            </label>
          ) : null}

          {error ? (
            <Alert variant="destructive" className="rounded-lg">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={labels.search || "Search files"}
                  aria-label={labels.search || "Search files"}
                  className="h-9 rounded-lg border-border bg-background pl-9 pr-8 text-sm shadow-none"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label={labels.clearSearch || "Clear search"}
                    className="absolute right-2 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                ) : null}
              </div>

              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as FileSort)}
                aria-label="Sort files"
                className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="newest">{labels.newest || "Newest"}</option>
                <option value="oldest">{labels.oldest || "Oldest"}</option>
                <option value="name">{labels.nameSort || "Name A–Z"}</option>
                <option value="size">{labels.sizeSort || "Largest"}</option>
              </select>
            </div>

            {availableKinds.length > 1 ? (
              <div className="flex gap-1 overflow-x-auto border-b border-border" role="tablist" aria-label="File type">
                <button
                  type="button"
                  role="tab"
                  aria-selected={kind === "all"}
                  onClick={() => setKind("all")}
                  className={`relative h-8 shrink-0 px-2.5 text-xs font-medium transition-colors ${kind === "all" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {labels.allTypes || "All"}
                  {kind === "all" ? <span className="absolute inset-x-1 bottom-0 h-0.5 bg-primary" /> : null}
                </button>
                {availableKinds.map((value) => (
                  <button
                    key={value}
                    type="button"
                    role="tab"
                    aria-selected={kind === value}
                    onClick={() => setKind(value)}
                    className={`relative h-8 shrink-0 px-2.5 text-xs font-medium transition-colors ${kind === value ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {typeLabels[value]}
                    {kind === value ? <span className="absolute inset-x-1 bottom-0 h-0.5 bg-primary" /> : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className={`grid min-h-0 gap-3 ${previewFile ? "md:grid-cols-[minmax(0,1fr)_240px]" : "grid-cols-1"}`}>
            <div className="min-w-0 overflow-hidden rounded-xl border border-border bg-card">
              <div className="hidden max-h-[360px] overflow-auto md:block">
                <Table className="min-w-[620px]">
                  <TableHeader className="sticky top-0 z-10 bg-muted/60 backdrop-blur">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[52%] px-4 text-xs font-medium text-muted-foreground">{labels.name}</TableHead>
                      <TableHead className="px-4 text-xs font-medium text-muted-foreground">{labels.size}</TableHead>
                      <TableHead className="px-4 text-xs font-medium text-muted-foreground">{labels.uploaded}</TableHead>
                      <TableHead className="px-4 text-right text-xs font-medium text-muted-foreground">{labels.action}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-40 text-center text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-2"><Loader2 className="size-4 animate-spin" />{labels.loading}</span>
                        </TableCell>
                      </TableRow>
                    ) : filteredFiles.length === 0 ? (
                      <TableRow><TableCell colSpan={4}>{emptyContent}</TableCell></TableRow>
                    ) : filteredFiles.map((file) => {
                      const isSelected = selectedFileId === file.id
                      const isPreviewing = previewFileId === file.id

                      return (
                        <TableRow key={file.id} data-state={isSelected ? "selected" : undefined} className={isPreviewing ? "bg-muted/35" : "group"}>
                          <TableCell className="px-4 py-2.5">
                            <button type="button" onClick={() => setPreviewFileId(file.id)} className="flex min-w-0 items-center gap-3 text-left">
                              <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-muted/30 text-muted-foreground"><FileTypeIcon file={file} /></span>
                              <span className="min-w-0"><span className="block truncate text-sm font-medium text-foreground">{file.name}</span><span className="mt-0.5 block truncate text-xs text-muted-foreground">/{file.alias}</span></span>
                            </button>
                          </TableCell>
                          <TableCell className="px-4 text-xs text-muted-foreground">{file.sizeLabel}</TableCell>
                          <TableCell className="px-4 text-xs text-muted-foreground">{formatFileDate(file.createdAt)}</TableCell>
                          <TableCell className="px-4 text-right">
                            <div className="inline-flex items-center gap-1">
                              <Button type="button" size="icon-sm" variant="ghost" aria-label={`${labels.preview || "Preview"} ${file.name}`} onClick={() => setPreviewFileId(file.id)} className="text-muted-foreground"><Eye className="size-4" /></Button>
                              <Button type="button" size="sm" variant={isSelected ? "secondary" : "outline"} onClick={() => onSelect(file)} className="h-8 rounded-lg shadow-none">
                                {isSelected ? <Check className="size-3.5" /> : null}{labels.select}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="max-h-[44dvh] overflow-y-auto divide-y divide-border md:hidden">
                {isLoading ? (
                  <div className="flex h-32 items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />{labels.loading}</div>
                ) : filteredFiles.length === 0 ? emptyContent : filteredFiles.map((file) => {
                  const isSelected = selectedFileId === file.id

                  return (
                    <div key={file.id} className={`p-3 ${previewFileId === file.id ? "bg-muted/30" : ""}`}>
                      <button type="button" onClick={() => setPreviewFileId(file.id)} className="flex w-full min-w-0 items-center gap-3 text-left">
                        <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-border bg-muted/30 text-muted-foreground"><FileTypeIcon file={file} className="size-5" /></span>
                        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-foreground">{file.name}</span><span className="mt-0.5 block text-xs text-muted-foreground">{file.sizeLabel} · {formatFileDate(file.createdAt)}</span></span>
                        <Eye className="size-4 shrink-0 text-muted-foreground" />
                      </button>
                      <Button type="button" size="sm" variant={isSelected ? "secondary" : "outline"} onClick={() => onSelect(file)} className="mt-3 h-9 w-full rounded-lg shadow-none">
                        {isSelected ? <Check className="size-3.5" /> : null}{labels.select}
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>

            {previewFile ? (
              <FilePreview
                file={previewFile}
                label={labels.preview || "Preview"}
                sizeLabel={labels.size}
                uploadedLabel={labels.uploaded}
              />
            ) : null}
          </div>
        </CredenzaBody>

        <CredenzaFooter className="flex-col-reverse gap-2 border-border bg-card sm:flex-row sm:items-center sm:justify-between">
          <div>{footer}</div>
          <CredenzaClose asChild><Button type="button" variant="outline" className="h-9 rounded-lg shadow-none">{labels.close}</Button></CredenzaClose>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  )
}
