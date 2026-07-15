"use client"

import { useMemo, useState } from "react"
import {
  Check,
  ChevronLeft,
  ChevronRight,
  FileCode2,
  Loader2,
  Plus,
  Search,
  X,
} from "lucide-react"
import { useTranslations } from "next-intl"

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
}: SnippetPickerCredenzaProps) {
  const t = useTranslations("CreateLink")
  const [tab, setTab] = useState<"existing" | "create">("existing")
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [draftId, setDraftId] = useState(selectedId || "")
  const [newName, setNewName] = useState("")
  const [newContent, setNewContent] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [formError, setFormError] = useState("")

  const filteredSnippets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const result = snippets.filter((snippet) => {
      if (!normalizedQuery) return true
      return `${snippet.name} ${snippet.content}`.toLowerCase().includes(normalizedQuery)
    })

    return result
  }, [query, snippets])

  const totalPages = Math.max(1, Math.ceil(filteredSnippets.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const visibleSnippets = filteredSnippets.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const activeDraftId = draftId || selectedId || ""
  const activeSnippet = snippets.find((snippet) => snippet.id === activeDraftId)

  const handlePickerOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setDraftId(selectedId || "")
      setTab("existing")
      setFormError("")
    }
    onOpenChange(nextOpen)
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

  return (
    <>
      <Credenza open={open} onOpenChange={handlePickerOpenChange}>
        <CredenzaContent className="sm:max-w-4xl">
          <CredenzaHeader className="border-b border-border">
             <CredenzaTitle>{t("snippetDialogTitle")}</CredenzaTitle>
          </CredenzaHeader>

          <CredenzaBody className="px-0 pb-0 p-5">
            <Tabs
              value={tab}
              onValueChange={(value) => {
                setTab(value as "existing" | "create")
                setFormError("")
              }}
              className="w-full gap-0"

            >
              <TabsList
              className="
     grid w-full grid-cols-2 gap-0
      
    ">
                <TabsTrigger value="existing" 
   >
                  {t("useExisting")}
                </TabsTrigger>
                <TabsTrigger value="create" 
>
                  {t("createNew")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="existing" className="m-0">
                <div className="flex flex-col gap-3">
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
                            className={`flex gap-3 p-3 transition-colors ${selected ? "bg-primary/5" : "hover:bg-muted/25"}`}
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
                                  <span>{formatDate(snippet.createdAt)}</span>
                                </span>
                              </span>
                            </button>
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

    </>
  )
}
