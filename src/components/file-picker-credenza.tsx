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
import { TablePagination } from "@/components/table-pagination"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  filesTab?: string
  uploadsTab?: string
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

function FileThumbnail({ file }: { file: ManagedFileDto }) {
  if (getFileKind(file) === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={getFilePreviewUrl(file)}
        alt=""
        className="size-10 shrink-0 rounded-lg border border-border bg-muted/30 object-cover"
      />
    )
  }

  return (
    <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-border bg-muted/30 text-muted-foreground">
      <FileTypeIcon file={file} className="size-5" />
    </span>
  )
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
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<FileSort>("newest")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [pendingFileId, setPendingFileId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const filteredFiles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const result = files.filter((file) => {
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
  }, [files, query, sort])

  const activeFileId = pendingFileId ?? selectedFileId ?? null
  const pendingFile = files.find((file) => file.id === activeFileId)
  const totalPages = Math.max(1, Math.ceil(filteredFiles.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paginatedFiles = filteredFiles.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  function handleDragOver(event: DragEvent<HTMLLabelElement>) {
    if (!upload?.onFiles || upload.isUploading) return
    event.preventDefault()
    event.dataTransfer.dropEffect = "copy"
    setIsDragging(true)
  }

  function handleOpenChange(nextOpen: boolean) {
    setIsDragging(false)
    if (!nextOpen) setPendingFileId(null)
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

  function handleSelectFile(file: ManagedFileDto) {
    setPendingFileId(file.id)
  }

  function handleConfirmSelection() {
    if (pendingFile) {
      onSelect(pendingFile)
      setPendingFileId(null)
    }
  }

  const emptyContent = query ? (
    <div className="flex flex-col items-center px-4 py-10 text-center">
      <Search className="size-5 text-muted-foreground" aria-hidden />
      <p className="mt-3 text-sm font-medium text-foreground">{labels.noResults || "No matching files"}</p>
      <button
        type="button"
        onClick={() => {
          setQuery("")
          setPage(1)
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
          <CredenzaTitle className="text-base font-semibold tracking-[-0.01em]">{title}</CredenzaTitle>
              {description ? <CredenzaDescription className="mt-1">{description}</CredenzaDescription> : null}
        </CredenzaHeader>

        <CredenzaBody className="space-y-4 pt-4">
          {error ? (
            <Alert variant="destructive" className="rounded-lg">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <Tabs defaultValue="files" className="w-full">
            <TabsList className="grid h-9 w-full grid-cols-2 sm:w-[260px]">
              <TabsTrigger value="files" className="text-xs sm:text-sm">
                {labels.filesTab || "Files"}
              </TabsTrigger>
              <TabsTrigger value="uploads" disabled={!upload} className="text-xs sm:text-sm">
                {labels.uploadsTab || "Uploads"}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="files" className="mt-4 space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value)
                      setPage(1)
                    }}
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
                  onChange={(event) => {
                    setSort(event.target.value as FileSort)
                    setPage(1)
                  }}
                  aria-label="Sort files"
                  className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="newest">{labels.newest || "Newest"}</option>
                  <option value="oldest">{labels.oldest || "Oldest"}</option>
                  <option value="name">{labels.nameSort || "Name A–Z"}</option>
                  <option value="size">{labels.sizeSort || "Largest"}</option>
                </select>
              </div>

              <div className="min-w-0 overflow-hidden rounded-xl border border-border bg-card">
              <div className="hidden max-h-[360px] overflow-auto md:block">
                <Table className="min-w-[560px]">
                  <TableHeader className="sticky top-0 z-10 bg-muted/60 backdrop-blur">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[52%] px-4 text-xs font-medium text-muted-foreground">{labels.name}</TableHead>
                      <TableHead className="px-4 text-xs font-medium text-muted-foreground">{labels.size}</TableHead>
                      <TableHead className="px-4 text-xs font-medium text-muted-foreground">{labels.uploaded}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={3} className="h-40 text-center text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-2"><Loader2 className="size-4 animate-spin" />{labels.loading}</span>
                        </TableCell>
                      </TableRow>
                    ) : filteredFiles.length === 0 ? (
                      <TableRow><TableCell colSpan={3}>{emptyContent}</TableCell></TableRow>
                    ) : paginatedFiles.map((file) => {
                      const isSelected = activeFileId === file.id

                      return (
                        <TableRow
                          key={file.id}
                          data-state={isSelected ? "selected" : undefined}
                          tabIndex={0}
                          aria-selected={isSelected}
                          onClick={() => handleSelectFile(file)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault()
                              handleSelectFile(file)
                            }
                          }}
                          className="cursor-pointer outline-none transition-colors focus-visible:bg-accent data-[state=selected]:bg-accent/60"
                        >
                          <TableCell className="px-4 py-2.5">
                            <div className="flex min-w-0 items-center gap-3 text-left">
                              <FileThumbnail file={file} />
                              <span className="min-w-0"><span className="block truncate text-sm font-medium text-foreground">{file.name}</span><span className="mt-0.5 block truncate text-xs text-muted-foreground">/{file.alias}</span></span>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 text-xs text-muted-foreground">{file.sizeLabel}</TableCell>
                          <TableCell className="px-4 text-xs text-muted-foreground">{formatFileDate(file.createdAt)}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="max-h-[44dvh] overflow-y-auto divide-y divide-border md:hidden">
                {isLoading ? (
                  <div className="flex h-32 items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />{labels.loading}</div>
                ) : filteredFiles.length === 0 ? emptyContent : paginatedFiles.map((file) => {
                  const isSelected = activeFileId === file.id

                  return (
                    <button
                      key={file.id}
                      type="button"
                      onClick={() => handleSelectFile(file)}
                      aria-pressed={isSelected}
                      className="flex w-full min-w-0 items-center gap-3 p-3 text-left outline-none transition-colors hover:bg-accent focus-visible:bg-accent data-[selected=true]:bg-accent/60"
                      data-selected={isSelected}
                    >
                      <FileThumbnail file={file} />
                        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-foreground">{file.name}</span><span className="mt-0.5 block text-xs text-muted-foreground">{file.sizeLabel} · {formatFileDate(file.createdAt)}</span></span>
                        {isSelected ? <Check className="size-4 shrink-0 text-primary" aria-hidden /> : null}
                    </button>
                  )
                })}
              </div>
              </div>

              {filteredFiles.length > 0 ? (
                <div className="border-t border-border px-3 py-3 sm:px-4">
                  <TablePagination
                    page={currentPage}
                    pageSize={pageSize}
                    totalItems={filteredFiles.length}
                    onPageChange={setPage}
                    onPageSizeChange={setPageSize}
                  />
                </div>
              ) : null}
            </TabsContent>

            <TabsContent value="uploads" className="mt-4">
              {upload ? (
                <label
                  htmlFor={inputId}
                  onDragEnter={handleDragOver}
                  onDragOver={handleDragOver}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`flex min-h-44 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-8 text-center transition-colors focus-within:ring-2 focus-within:ring-primary/40 ${
                    isDragging
                      ? "border-primary bg-primary/5"
                      : "border-border bg-muted/15 hover:border-primary/35 hover:bg-muted/25"
                  } ${upload.isUploading ? "pointer-events-none opacity-70" : ""}`}
                >
                  <span className="grid size-11 place-items-center rounded-lg border border-border bg-background text-muted-foreground">
                    {upload.isUploading ? <Loader2 className="size-5 animate-spin" /> : <UploadCloud className="size-5" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-foreground">
                      {upload.isUploading ? upload.uploadingLabel : labels.dragHint || "Drop files here or browse"}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {labels.browseHint || upload.label}
                    </span>
                  </span>
                  <span className="inline-flex h-9 items-center rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground">
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
            </TabsContent>
          </Tabs>
        </CredenzaBody>

        <CredenzaFooter className="flex-col-reverse gap-2 border-border bg-card sm:flex-row sm:items-center sm:justify-between">
          <div>{footer}</div>
          <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
            <CredenzaClose asChild>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPendingFileId(null)}
                className="h-9 rounded-lg shadow-none"
              >
                {labels.close}
              </Button>
            </CredenzaClose>
            <Button
              type="button"
              onClick={handleConfirmSelection}
              disabled={!pendingFile || isLoading}
              className="h-9 rounded-lg shadow-none"
            >
              {pendingFile ? <Check className="size-3.5" aria-hidden /> : null}
              {labels.select}
            </Button>
          </div>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  )
}
