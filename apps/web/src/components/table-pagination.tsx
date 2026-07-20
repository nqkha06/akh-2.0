"use client"

import { useId, type ReactNode } from "react"
import {
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"

import { Label } from "@/components/ui/label"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50]

type PageEntry =
  | { type: "page"; page: number }
  | { type: "ellipsis"; key: string; hiddenCount: number }

type TablePaginationProps = {
  page: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  pageSizeOptions?: number[]
  className?: string
}

function getPageEntries(currentPage: number, totalPages: number): PageEntry[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => ({ type: "page", page: index + 1 }))
  }

  const pages = [...new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1])]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b)
  const entries: PageEntry[] = []

  pages.forEach((page, index) => {
    const previousPage = pages[index - 1]
    if (previousPage) {
      const gap = page - previousPage
      if (gap === 2) entries.push({ type: "page", page: previousPage + 1 })
      if (gap > 2) entries.push({ type: "ellipsis", key: `${previousPage}-${page}`, hiddenCount: gap - 1 })
    }
    entries.push({ type: "page", page })
  })

  return entries
}

export function TablePagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  className,
}: TablePaginationProps) {
  const id = useId()
  const t = useTranslations("Pagination")
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const currentPage = Math.min(Math.max(page, 1), totalPages)
  const firstItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const lastItem = Math.min(currentPage * pageSize, totalItems)
  const pageEntries = getPageEntries(currentPage, totalPages)
  const selectItems = [...new Set([...pageSizeOptions, pageSize])].sort((a, b) => a - b)

  const changePage = (nextPage: number) => {
    onPageChange(Math.min(Math.max(nextPage, 1), totalPages))
  }

  const navigationLink = (
    targetPage: number,
    label: string,
    disabled: boolean,
    icon: ReactNode,
  ) => (
    <PaginationLink
      href={`#page-${targetPage}`}
      aria-label={label}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : undefined}
      size="icon"
      className={cn("", disabled && "pointer-events-none opacity-40")}
      onClick={(event) => {
        event.preventDefault()
        if (!disabled) changePage(targetPage)
      }}
    >
      {icon}
    </PaginationLink>
  )

  return (
    <div className={cn("flex w-full flex-wrap items-center justify-between gap-6 max-sm:justify-center", className)}>
      <div className="flex shrink-0 items-center gap-3">
        <Label htmlFor={id}>{t("rowsPerPage")}</Label>
        <Select
          value={String(pageSize)}
          onValueChange={(value) => {
            onPageSizeChange(Number(value))
            onPageChange(1)
          }}
        >
          <SelectTrigger id={id} className="w-fit whitespace-nowrap">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {selectItems.map((item) => (
                <SelectItem key={item} value={String(item)}>
                  {item}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <p className="flex grow items-center justify-end whitespace-nowrap text-sm text-muted-foreground max-sm:justify-center" aria-live="polite">
        {t("showing")} <span className="mx-1 text-foreground">{firstItem}</span> {t("to")} <span className="mx-1 text-foreground">{lastItem}</span> {t("of")} <span className="mx-1 text-foreground">{totalItems}</span> {t("items")}
      </p>

      <TooltipProvider>
        <Pagination className="w-fit max-sm:mx-0">
          <PaginationContent>
            <PaginationItem>
              {navigationLink(1, t("firstPage"), currentPage === 1, <ChevronFirstIcon className="size-4" />)}
            </PaginationItem>
            <PaginationItem>
              {navigationLink(currentPage - 1, t("previousPage"), currentPage === 1, <ChevronLeftIcon className="size-4" />)}
            </PaginationItem>

            {pageEntries.map((entry) => entry.type === "page" ? (
              <PaginationItem key={entry.page} className={entry.page === currentPage ? undefined : "max-sm:hidden"}>
                <PaginationLink
                  href={`#page-${entry.page}`}
                  isActive={entry.page === currentPage}
                  aria-label={t("goToPage", { page: entry.page })}
                  onClick={(event) => {
                    event.preventDefault()
                    changePage(entry.page)
                  }}
                >
                  {entry.page}
                </PaginationLink>
              </PaginationItem>
            ) : (
              <PaginationItem key={entry.key} className="max-sm:hidden">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0} aria-label={t("morePages", { count: entry.hiddenCount })}>
                      <PaginationEllipsis />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t("morePages", { count: entry.hiddenCount })}</p>
                  </TooltipContent>
                </Tooltip>
              </PaginationItem>
            ))}

            <PaginationItem>
              {navigationLink(currentPage + 1, t("nextPage"), currentPage === totalPages, <ChevronRightIcon className="size-4" />)}
            </PaginationItem>
            <PaginationItem>
              {navigationLink(totalPages, t("lastPage"), currentPage === totalPages, <ChevronLastIcon className="size-4" />)}
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </TooltipProvider>
    </div>
  )
}
