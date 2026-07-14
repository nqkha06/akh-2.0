"use client"

import { useMemo, useState } from "react"
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clipboard,
  Copy,
  Eye,
  FileCode2,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import type { SnippetDto } from "@/lib/api-client"
import { formatSnippetSize } from "../lib/media"

type SnippetSort = "newest" | "oldest" | "copies" | "size"

type SnippetPickerCredenzaProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  snippets: SnippetDto[]
  selectedId?: string
  isLoading?: boolean
  loadError?: string
  onRetry?: () => void
  onSelect: (snippet: SnippetDto) => void
  onCreate: (payload: { name?: string; content: string }) => Promise<SnippetDto>
  onUpdate: (id: string, payload: { name?: string; content?: string }) => Promise<SnippetDto>
  onDelete: (id: string) => Promise<void>
}

const PAGE_SIZE = 6

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value))
}

export function SnippetPickerCredenza({
  open,
  onOpenChange,
  snippets,
  selectedId,
  isLoading = false,
  loadError,
  onRetry,
  onSelect,
  onCreate,
  onUpdate,
  onDelete,
}: SnippetPickerCredenzaProps) {
  const t = useTranslations("CreateLink")
  const [tab, setTab] = useState<"existing" | "create">("existing")
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<SnippetSort>("newest")
  const [page, setPage] = useState(1)
  const [draftId, setDraftId] = useState(selectedId || "")
  const [newName, setNewName] = useState("")
  const [newContent, setNewContent] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [formError, setFormError] = useState("")

  const [previewId, setPreviewId] = useState("")
  const [previewOpen, setPreviewOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState("")
  const [editContent, setEditContent] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const filteredSnippets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const result = snippets.filter((snippet) => {
      if (!normalizedQuery) return true
      return `${snippet.name} ${snippet.content}`.toLowerCase().includes(normalizedQuery)
    })

    return result.sort((a, b) => {
      if (sort === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      if (sort === "copies") return b.copies - a.copies
      if (sort === "size") return b.content.length - a.content.length
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [query, snippets, sort])

  const totalPages = Math.max(1, Math.ceil(filteredSnippets.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const visibleSnippets = filteredSnippets.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const activeDraftId = draftId || selectedId || ""
  const activeSnippet = snippets.find((snippet) => snippet.id === activeDraftId)
  const previewSnippet = snippets.find((snippet) => snippet.id === previewId)

  const handlePickerOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setDraftId(selectedId || "")
      setTab("existing")
      setFormError("")
    }
    onOpenChange(nextOpen)
  }

  const showPreview = (snippet: SnippetDto) => {
    setPreviewId(snippet.id)
    setEditName(snippet.name)
    setEditContent(snippet.content)
    setIsEditing(false)
    setConfirmDelete(false)
    onOpenChange(false)
    setPreviewOpen(true)
  }

  const closePreview = (returnToPicker = true) => {
    setPreviewOpen(false)
    setIsEditing(false)
    setConfirmDelete(false)
    if (returnToPicker) onOpenChange(true)
  }

  const handleCreate = async () => {
    const content = newContent.trim()
    if (!content) {
      setFormError(t("snippetContentRequired"))
      return
    }

    try {
      setIsCreating(true)
      setFormError("")
      const created = await onCreate({ name: newName.trim() || undefined, content })
      setNewName("")
      setNewContent("")
      onSelect(created)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : t("snippetCreateFailed"))
    } finally {
      setIsCreating(false)
    }
  }

  const handleSave = async () => {
    if (!previewSnippet) return
    const content = editContent.trim()
    if (!content) {
      toast.error(t("snippetContentRequired"))
      return
    }

    try {
      setIsSaving(true)
      await onUpdate(previewSnippet.id, {
        name: editName.trim() || undefined,
        content,
      })
      setIsEditing(false)
      toast.success(t("snippetUpdated"))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("snippetUpdateFailed"))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDuplicate = async () => {
    if (!previewSnippet) return
    try {
      setIsDuplicating(true)
      const duplicate = await onCreate({
        name: t("snippetCopyName", { name: previewSnippet.name }),
        content: previewSnippet.content,
      })
      setPreviewId(duplicate.id)
      setEditName(duplicate.name)
      setEditContent(duplicate.content)
      setDraftId(duplicate.id)
      toast.success(t("snippetDuplicated"))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("snippetDuplicateFailed"))
    } finally {
      setIsDuplicating(false)
    }
  }

  const handleDelete = async () => {
    if (!previewSnippet) return
    try {
      setIsDeleting(true)
      await onDelete(previewSnippet.id)
      if (draftId === previewSnippet.id) setDraftId("")
      toast.success(t("snippetDeleted"))
      closePreview(true)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("snippetDeleteFailed"))
    } finally {
      setIsDeleting(false)
    }
  }

  const copyContent = async () => {
    if (!previewSnippet) return
    await navigator.clipboard.writeText(previewSnippet.content)
    toast.success(t("snippetCopied"))
  }

  return (
    <>
      <Credenza open={open} onOpenChange={handlePickerOpenChange}>
        <CredenzaContent className="sm:max-w-4xl">
          <CredenzaHeader className="border-b border-border">
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-muted/40 text-muted-foreground">
                <FileCode2 className="size-4" />
              </span>
              <div className="min-w-0">
                <CredenzaTitle>{t("snippetDialogTitle")}</CredenzaTitle>
                <CredenzaDescription className="mt-1">
                  {t("snippetPickerDescription")}
                </CredenzaDescription>
              </div>
            </div>
          </CredenzaHeader>

          <CredenzaBody className="px-0 pb-0">
            <Tabs
              value={tab}
              onValueChange={(value) => {
                setTab(value as "existing" | "create")
                setFormError("")
              }}
              className="gap-0"
            >
              <TabsList variant="line" className="grid h-11 w-full grid-cols-2 rounded-none border-b border-border bg-transparent px-5 py-0">
                <TabsTrigger value="existing" className="h-11 rounded-none border-0 shadow-none data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                  {t("useExisting")}
                </TabsTrigger>
                <TabsTrigger value="create" className="h-11 rounded-none border-0 shadow-none data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                  {t("createNew")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="existing" className="m-0 p-5">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <label className="relative min-w-0 flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={query}
                      onChange={(event) => {
                        setQuery(event.target.value)
                        setPage(1)
                      }}
                      placeholder={t("searchSnippets")}
                      className="h-10 pl-9 pr-9"
                    />
                    {query ? (
                      <button
                        type="button"
                        onClick={() => {
                          setQuery("")
                          setPage(1)
                        }}
                        className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                        aria-label={t("clearFilters")}
                      >
                        <X className="size-3.5" />
                      </button>
                    ) : null}
                  </label>
                  <select
                    value={sort}
                    onChange={(event) => {
                      setSort(event.target.value as SnippetSort)
                      setPage(1)
                    }}
                    className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={t("sortSnippets")}
                  >
                    <option value="newest">{t("newest")}</option>
                    <option value="oldest">{t("oldest")}</option>
                    <option value="copies">{t("mostCopied")}</option>
                    <option value="size">{t("largestSnippet")}</option>
                  </select>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{t("snippetCount", { count: filteredSnippets.length })}</span>
                  {totalPages > 1 ? <span>{t("pageOf", { page: safePage, total: totalPages })}</span> : null}
                </div>

                <div className="mt-3 min-h-64 overflow-hidden rounded-xl border border-border bg-card">
                  {isLoading ? (
                    <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" />
                      {t("loading")}
                    </div>
                  ) : loadError ? (
                    <div className="flex min-h-64 flex-col items-center justify-center gap-3 px-6 text-center">
                      <p className="text-sm text-destructive">{loadError}</p>
                      {onRetry ? <Button type="button" variant="outline" size="sm" onClick={onRetry}>{t("retry")}</Button> : null}
                    </div>
                  ) : visibleSnippets.length === 0 ? (
                    <div className="flex min-h-64 flex-col items-center justify-center gap-3 px-6 text-center">
                      <span className="grid size-10 place-items-center rounded-lg border border-border bg-muted/30 text-muted-foreground">
                        <FileCode2 className="size-5" />
                      </span>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {query ? t("noSnippetResults") : t("noSnippets")}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {query ? t("tryAnotherSearch") : t("createFirstSnippet")}
                        </p>
                      </div>
                      {!query ? (
                        <Button type="button" variant="outline" size="sm" onClick={() => setTab("create")}>
                          <Plus className="size-4" />
                          {t("createNew")}
                        </Button>
                      ) : null}
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {visibleSnippets.map((snippet) => {
                        const selected = activeDraftId === snippet.id
                        return (
                          <div
                            key={snippet.id}
                            className={`group flex gap-3 p-3 transition-colors ${selected ? "bg-primary/5" : "hover:bg-muted/25"}`}
                          >
                            <button
                              type="button"
                              onClick={() => setDraftId(snippet.id)}
                              className="flex min-w-0 flex-1 items-start gap-3 text-left"
                            >
                              <span className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border ${selected ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground"}`}>
                                {selected ? <Check className="size-4" /> : <FileCode2 className="size-4" />}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="flex items-center gap-2">
                                  <span className="truncate text-sm font-medium text-foreground">{snippet.name}</span>
                                  {selected ? <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">{t("selected")}</span> : null}
                                </span>
                                <span className="mt-1 block truncate font-mono text-xs text-muted-foreground">{snippet.content}</span>
                                <span className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                                  <span>{formatSnippetSize(snippet.content)}</span>
                                  <span>{t("copyCount", { count: snippet.copies })}</span>
                                  <span>{formatDate(snippet.createdAt)}</span>
                                </span>
                              </span>
                            </button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => showPreview(snippet)}
                              aria-label={t("previewSnippet", { name: snippet.name })}
                              className="shrink-0 text-muted-foreground hover:text-foreground"
                            >
                              <Eye className="size-4" />
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {totalPages > 1 ? (
                  <div className="mt-3 flex items-center justify-end gap-1">
                    <Button type="button" variant="outline" size="icon-sm" disabled={safePage === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                      <ChevronLeft className="size-4" />
                    </Button>
                    <Button type="button" variant="outline" size="icon-sm" disabled={safePage === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                ) : null}
              </TabsContent>

              <TabsContent value="create" className="m-0 space-y-4 p-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">{t("snippetName")}</label>
                  <Input value={newName} onChange={(event) => setNewName(event.target.value)} placeholder={t("snippetNamePlaceholder")} className="h-10" />
                  <p className="mt-1.5 text-xs text-muted-foreground">{t("snippetNameOptional")}</p>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label className="text-sm font-medium text-foreground">{t("codeOrText")}</label>
                    <span className="text-xs tabular-nums text-muted-foreground">{t("characterCount", { count: newContent.length })}</span>
                  </div>
                  <Textarea
                    value={newContent}
                    onChange={(event) => {
                      setNewContent(event.target.value)
                      if (formError) setFormError("")
                    }}
                    placeholder={t("snippetContentPlaceholder")}
                    className={`min-h-64 resize-y font-mono text-sm ${formError ? "border-destructive" : ""}`}
                    aria-invalid={Boolean(formError)}
                  />
                  <div className="mt-2 flex items-center justify-between gap-3 text-xs">
                    <span className={formError ? "text-destructive" : "text-muted-foreground"}>{formError || t("snippetContentHint")}</span>
                    <span className="shrink-0 text-muted-foreground">{formatSnippetSize(newContent)}</span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CredenzaBody>

          <CredenzaFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
            {tab === "existing" ? (
              <Button type="button" disabled={!activeSnippet} onClick={() => activeSnippet && onSelect(activeSnippet)}>
                <Check className="size-4" />
                {t("useSnippet")}
              </Button>
            ) : (
              <Button type="button" disabled={!newContent.trim() || isCreating} onClick={handleCreate}>
                {isCreating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                {isCreating ? t("creating") : t("createAndUse")}
              </Button>
            )}
          </CredenzaFooter>
        </CredenzaContent>
      </Credenza>

      <Credenza open={previewOpen} onOpenChange={(nextOpen) => nextOpen ? setPreviewOpen(true) : closePreview(true)}>
        <CredenzaContent className="sm:max-w-3xl">
          <CredenzaHeader className="border-b border-border">
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-muted/40 text-muted-foreground">
                <Eye className="size-4" />
              </span>
              <div className="min-w-0">
                <CredenzaTitle>{t("snippetPreview")}</CredenzaTitle>
                <CredenzaDescription className="mt-1 truncate">
                  {previewSnippet?.name || t("snippetDialogTitle")}
                </CredenzaDescription>
              </div>
            </div>
          </CredenzaHeader>

          <CredenzaBody className="space-y-4 pt-5">
            {previewSnippet ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>{formatSnippetSize(previewSnippet.content)}</span>
                    <span>{t("copyCount", { count: previewSnippet.copies })}</span>
                    <span>{formatDate(previewSnippet.createdAt)}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Button type="button" variant="ghost" size="sm" onClick={copyContent}>
                      <Clipboard className="size-4" />
                      {t("copyContent")}
                    </Button>
                    <Button type="button" variant="ghost" size="sm" disabled={isDuplicating} onClick={handleDuplicate}>
                      {isDuplicating ? <Loader2 className="size-4 animate-spin" /> : <Copy className="size-4" />}
                      {t("duplicate")}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditName(previewSnippet.name)
                        setEditContent(previewSnippet.content)
                        setIsEditing((current) => !current)
                        setConfirmDelete(false)
                      }}
                    >
                      <Pencil className="size-4" />
                      {isEditing ? t("cancelEdit") : t("edit")}
                    </Button>
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-4 rounded-xl border border-border bg-muted/15 p-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">{t("snippetName")}</label>
                      <Input value={editName} onChange={(event) => setEditName(event.target.value)} className="h-10" />
                    </div>
                    <div>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <label className="text-sm font-medium text-foreground">{t("codeOrText")}</label>
                        <span className="text-xs tabular-nums text-muted-foreground">{t("characterCount", { count: editContent.length })}</span>
                      </div>
                      <Textarea value={editContent} onChange={(event) => setEditContent(event.target.value)} className="min-h-64 resize-y font-mono text-sm" />
                    </div>
                    <div className="flex justify-end">
                      <Button type="button" disabled={!editContent.trim() || isSaving} onClick={handleSave}>
                        {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                        {isSaving ? t("saving") : t("saveSnippet")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <pre className="max-h-[52dvh] min-h-64 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-border bg-muted/25 p-4 font-mono text-sm leading-6 text-foreground">
                    {previewSnippet.content}
                  </pre>
                )}

                <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
                  {confirmDelete ? (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{t("confirmDeleteSnippet")}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{t("confirmDeleteSnippetDescription")}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => setConfirmDelete(false)}>{t("cancel")}</Button>
                        <Button type="button" variant="destructive" size="sm" disabled={isDeleting} onClick={handleDelete}>
                          {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                          {isDeleting ? t("deleting") : t("deleteSnippet")}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{t("deleteSnippet")}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{t("deleteSnippetHint")}</p>
                      </div>
                      <Button type="button" variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setConfirmDelete(true)}>
                        <Trash2 className="size-4" />
                        {t("delete")}
                      </Button>
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </CredenzaBody>

          <CredenzaFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button type="button" variant="ghost" onClick={() => closePreview(true)}>
              <ChevronLeft className="size-4" />
              {t("backToSnippets")}
            </Button>
            <Button
              type="button"
              disabled={!previewSnippet}
              onClick={() => {
                if (!previewSnippet) return
                setPreviewOpen(false)
                onSelect(previewSnippet)
              }}
            >
              <Check className="size-4" />
              {t("useSnippet")}
            </Button>
          </CredenzaFooter>
        </CredenzaContent>
      </Credenza>
    </>
  )
}
