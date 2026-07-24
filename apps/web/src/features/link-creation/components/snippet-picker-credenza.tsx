"use client"

import { useMemo, useState } from "react"
import {
  Check,
  FileCode2,
  Loader2,
  Plus,
  Search,
  X,
} from "lucide-react"
import { useTranslations } from "next-intl"

import { TablePagination } from "@/components/table-pagination"
import { Button } from "@/components/ui/button"
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
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
  onCreate: (payload: {
    name?: string
    content: string
  }) => Promise<SnippetDto>
}

function formatDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "—"
  }

  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date)
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
  const [pageSize, setPageSize] = useState(10)
  const [draftId, setDraftId] = useState(selectedId ?? "")

  const [newName, setNewName] = useState("")
  const [newContent, setNewContent] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [formError, setFormError] = useState("")

  const filteredSnippets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) {
      return snippets
    }

    return snippets.filter((snippet) => {
      const searchableValue = [
        snippet.name,
        snippet.content,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return searchableValue.includes(normalizedQuery)
    })
  }, [query, snippets])

  const totalPages = Math.max(
    1,
    Math.ceil(filteredSnippets.length / pageSize),
  )

  const safePage = Math.min(
    Math.max(page, 1),
    totalPages,
  )

  const visibleSnippets = useMemo(() => {
    const startIndex = (safePage - 1) * pageSize
    const endIndex = startIndex + pageSize

    return filteredSnippets.slice(startIndex, endIndex)
  }, [filteredSnippets, pageSize, safePage])

  const activeDraftId = draftId || selectedId || ""

  const activeSnippet = useMemo(
    () =>
      snippets.find(
        (snippet) => snippet.id === activeDraftId,
      ),
    [activeDraftId, snippets],
  )

  const handlePickerOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setDraftId(selectedId ?? "")
      setTab("existing")
      setPage(1)
      setFormError("")
    }

    onOpenChange(nextOpen)
  }

  const handleTabChange = (value: string) => {
    setTab(value as "existing" | "create")
    setFormError("")
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

      const created = await onCreate({
        name: newName.trim() || undefined,
        content,
      })

      setNewName("")
      setNewContent("")

      onSelect(created)
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : t("snippetCreateFailed"),
      )
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Credenza
      open={open}
      onOpenChange={handlePickerOpenChange}
    >
      <CredenzaContent className="flex max-h-[90dvh] flex-col overflow-hidden p-0 sm:max-w-[960px]">
        <CredenzaHeader className="shrink-0 border-b px-5 py-4 sm:px-6">
          <CredenzaTitle className="text-lg font-semibold tracking-tight">
            {t("snippetDialogTitle")}
          </CredenzaTitle>
        </CredenzaHeader>

        <CredenzaBody className="min-h-0 flex-1 overflow-y-auto p-0">
          <Tabs
            value={tab}
            onValueChange={handleTabChange}
            className="gap-0"
          >
            <div className="border-b bg-muted/20 px-4 py-3 sm:px-6">
              <TabsList className="grid h-9 w-full grid-cols-2 rounded-lg bg-muted p-1 sm:w-[360px]">
                <TabsTrigger
                  value="existing"
                  className={cn(
                    "h-7 gap-2 rounded-md px-4 text-sm",
                    "data-[state=active]:bg-background",
                    "data-[state=active]:shadow-sm",
                  )}
                >
                  <FileCode2
                    className="size-4"
                    aria-hidden="true"
                  />

                  {t("useExisting")}
                </TabsTrigger>

                <TabsTrigger
                  value="create"
                  className={cn(
                    "h-7 gap-2 rounded-md px-4 text-sm",
                    "data-[state=active]:bg-background",
                    "data-[state=active]:shadow-sm",
                  )}
                >
                  <Plus
                    className="size-4"
                    aria-hidden="true"
                  />

                  {t("createNew")}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent
              value="existing"
              className="m-0 p-4 sm:p-6"
            >
              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative w-full sm:max-w-md">
                    <Search
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    />

                    <Input
                      value={query}
                      onChange={(event) => {
                        setQuery(event.target.value)
                        setPage(1)
                      }}
                      placeholder={t("searchSnippets")}
                      aria-label={t("searchSnippets")}
                      className="h-9 bg-background pl-9 pr-9 shadow-none"
                    />

                    {query ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setQuery("")
                          setPage(1)
                        }}
                        className="absolute right-1 top-1/2 size-7 -translate-y-1/2 text-muted-foreground"
                        aria-label={t("clearFilters")}
                      >
                        <X
                          className="size-3.5"
                          aria-hidden="true"
                        />
                      </Button>
                    ) : null}
                  </div>

                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {filteredSnippets.length} snippet
                  </span>
                </div>

                <div className="overflow-hidden rounded-xl border bg-background">
  {/* Mobile list */}
  <div className="divide-y sm:hidden">
    {isLoading ? (
      <div className="flex h-48 items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        {t("loading")}
      </div>
    ) : loadError ? (
      <div className="flex h-48 flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm text-destructive">
          {loadError}
        </p>

        {onRetry ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRetry}
          >
            {t("retry")}
          </Button>
        ) : null}
      </div>
    ) : visibleSnippets.length === 0 ? (
      <div className="flex h-48 flex-col items-center justify-center px-6 text-center">
        <span className="grid size-10 place-items-center rounded-lg border bg-muted/40 text-muted-foreground">
          <FileCode2 className="size-5" />
        </span>

        <p className="mt-3 text-sm font-medium">
          {query
            ? t("noSnippetResults")
            : t("noSnippets")}
        </p>

        <p className="mt-1 text-xs text-muted-foreground">
          {query
            ? t("tryAnotherSearch")
            : t("createFirstSnippet")}
        </p>
      </div>
    ) : (
      visibleSnippets.map((snippet) => {
        const selected =
          activeDraftId === snippet.id

        return (
          <button
            key={snippet.id}
            type="button"
            onClick={() => setDraftId(snippet.id)}
            aria-pressed={selected}
            className={cn(
              "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
              selected
                ? "bg-primary/5"
                : "hover:bg-muted/40",
            )}
          >
            <span
              className={cn(
                "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border transition-colors",
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted-foreground/30 bg-background text-transparent",
              )}
            >
              <Check className="size-3" />
            </span>

            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">
                {snippet.name || "—"}
              </span>

              <code
                className="mt-1 block truncate text-xs text-muted-foreground"
                title={snippet.content}
              >
                {snippet.content}
              </code>

              <span className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                <span>
                  {formatSnippetSize(snippet.content)}
                </span>

                <span aria-hidden="true">·</span>

                <span>
                  {formatDate(snippet.createdAt)}
                </span>
              </span>
            </span>
          </button>
        )
      })
    )}
  </div>

  {/* Desktop table */}
  <div className="hidden max-h-[420px] overflow-auto sm:block">
    <Table className="w-full table-fixed">
      <TableHeader className="sticky top-0 z-10 bg-muted/95 backdrop-blur">
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-12 px-3">
            <span className="sr-only">
              {t("selected")}
            </span>
          </TableHead>

          <TableHead className="w-[28%] px-3">
            {t("snippetName")}
          </TableHead>

          <TableHead className="px-3">
            {t("codeOrText")}
          </TableHead>

          <TableHead className="w-24 px-3">
            {t("size")}
          </TableHead>

          <TableHead className="w-32 px-3">
            {t("created")}
          </TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {isLoading ? (
          <TableRow className="hover:bg-transparent">
            <TableCell
              colSpan={5}
              className="h-56 text-center"
            >
              <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                {t("loading")}
              </span>
            </TableCell>
          </TableRow>
        ) : loadError ? (
          <TableRow className="hover:bg-transparent">
            <TableCell
              colSpan={5}
              className="h-56 text-center"
            >
              <div className="flex flex-col items-center justify-center gap-3">
                <p className="text-sm text-destructive">
                  {loadError}
                </p>

                {onRetry ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onRetry}
                  >
                    {t("retry")}
                  </Button>
                ) : null}
              </div>
            </TableCell>
          </TableRow>
        ) : visibleSnippets.length === 0 ? (
          <TableRow className="hover:bg-transparent">
            <TableCell
              colSpan={5}
              className="h-56 text-center"
            >
              <div className="flex flex-col items-center justify-center">
                <FileCode2 className="size-5 text-muted-foreground" />

                <p className="mt-3 text-sm font-medium">
                  {query
                    ? t("noSnippetResults")
                    : t("noSnippets")}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  {query
                    ? t("tryAnotherSearch")
                    : t("createFirstSnippet")}
                </p>
              </div>
            </TableCell>
          </TableRow>
        ) : (
          visibleSnippets.map((snippet) => {
            const selected =
              activeDraftId === snippet.id

            return (
              <TableRow
                key={snippet.id}
                tabIndex={0}
                aria-selected={selected}
                onClick={() =>
                  setDraftId(snippet.id)
                }
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" ||
                    event.key === " "
                  ) {
                    event.preventDefault()
                    setDraftId(snippet.id)
                  }
                }}
                className={cn(
                  "group cursor-pointer outline-none",
                  "hover:bg-muted/40 focus-visible:bg-accent",
                  selected &&
                    "bg-primary/5 hover:bg-primary/5",
                )}
              >
                <TableCell className="px-3 py-3">
                  <span
                    className={cn(
                      "grid size-5 place-items-center rounded-full border",
                      selected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/30 text-transparent group-hover:border-primary/50",
                    )}
                  >
                    <Check className="size-3" />
                  </span>
                </TableCell>

                <TableCell className="px-3 py-3">
                  <p className="truncate text-sm font-medium">
                    {snippet.name || "—"}
                  </p>
                </TableCell>

                <TableCell className="px-3 py-3">
                  <code
                    className="block truncate text-xs text-muted-foreground"
                    title={snippet.content}
                  >
                    {snippet.content}
                  </code>
                </TableCell>

                <TableCell className="whitespace-nowrap px-3 py-3 text-xs text-muted-foreground">
                  {formatSnippetSize(
                    snippet.content,
                  )}
                </TableCell>

                <TableCell className="whitespace-nowrap px-3 py-3 text-xs text-muted-foreground">
                  {formatDate(snippet.createdAt)}
                </TableCell>
              </TableRow>
            )
          })
        )}
      </TableBody>
    </Table>
  </div>

  {filteredSnippets.length > 0 ? (
    <div className="border-t bg-muted/20 px-3 py-3 sm:px-4">
      <TablePagination
        page={safePage}
        pageSize={pageSize}
        totalItems={filteredSnippets.length}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setPage(1)
        }}
        className="gap-3"
      />
    </div>
  ) : null}
</div>
              </div>
            </TabsContent>

            <TabsContent
              value="create"
              className="m-0 p-4 sm:p-6"
            >
              <div className="mx-auto max-w-3xl space-y-5">
                <div className="space-y-2">
                  <label
                    htmlFor="snippet-name"
                    className="text-sm font-medium"
                  >
                    {t("snippetName")}
                  </label>

                  <Input
                    id="snippet-name"
                    value={newName}
                    onChange={(event) =>
                      setNewName(event.target.value)
                    }
                    placeholder={t(
                      "snippetNamePlaceholder",
                    )}
                    className="h-9 shadow-none"
                  />

                  <p className="text-xs text-muted-foreground">
                    {t("snippetNameOptional")}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <label
                      htmlFor="snippet-content"
                      className="text-sm font-medium"
                    >
                      {t("codeOrText")}
                    </label>

                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {t("characterCount", {
                        count: newContent.length,
                      })}
                    </span>
                  </div>

                  <Textarea
                    id="snippet-content"
                    value={newContent}
                    onChange={(event) => {
                      setNewContent(event.target.value)

                      if (formError) {
                        setFormError("")
                      }
                    }}
                    placeholder={t(
                      "snippetContentPlaceholder",
                    )}
                    className={cn(
                      "min-h-72 resize-y font-mono text-sm leading-relaxed shadow-none",
                      formError &&
                        "border-destructive focus-visible:ring-destructive",
                    )}
                    aria-invalid={Boolean(formError)}
                  />

                  <div className="flex items-start justify-between gap-4 text-xs">
                    <span
                      className={cn(
                        "min-w-0",
                        formError
                          ? "text-destructive"
                          : "text-muted-foreground",
                      )}
                    >
                      {formError ||
                        t("snippetContentHint")}
                    </span>

                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {formatSnippetSize(newContent)}
                    </span>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CredenzaBody>

        <CredenzaFooter className="shrink-0 border-t bg-background px-4 py-3 sm:px-6">
  <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
    <Button
      type="button"
      variant="ghost"
      onClick={() => onOpenChange(false)}
      className="order-2 w-full sm:order-1 sm:w-auto"
    >
      {t("cancel")}
    </Button>

    {tab === "existing" ? (
      <Button
        type="button"
        disabled={!activeSnippet}
        onClick={() => {
          if (activeSnippet) {
            onSelect(activeSnippet)
          }
        }}
        className="order-1 w-full sm:order-2 sm:w-auto"
      >
        <Check className="size-4" />
        {t("useSnippet")}
      </Button>
    ) : (
      <Button
        type="button"
        disabled={!newContent.trim() || isCreating}
        onClick={handleCreate}
        className="order-1 w-full sm:order-2 sm:w-auto"
      >
        {isCreating ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Plus className="size-4" />
        )}

        {isCreating
          ? t("creating")
          : t("createAndUse")}
      </Button>
    )}
  </div>
</CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  )
}