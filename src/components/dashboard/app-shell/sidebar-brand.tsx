"use client"

import Link from "next/link"
import { ChevronLeft, ChevronRight, LockKeyhole } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export function BrandMark({ className = "size-8" }: { className?: string }) {
  return (
    <span className={`grid shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground ${className}`}>
      <LockKeyhole className="size-[55%]" strokeWidth={2.35} />
    </span>
  )
}

export function SidebarBrand({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  if (collapsed) {
    return (
      <div className="flex h-[var(--header-height)] items-center justify-center border-b border-sidebar-border px-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="size-10 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent"
              aria-label="Mở rộng sidebar"
            >
              <BrandMark className="size-8" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            Mở rộng sidebar
          </TooltipContent>
        </Tooltip>
      </div>
    )
  }

  return (
    <div className="flex h-[var(--header-height)] items-center gap-3 border-b border-sidebar-border px-4">
      <Link href="/member" className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring">
        <BrandMark className="size-8" />
        <span className="truncate text-[19px] font-semibold tracking-[-0.02em] text-sidebar-foreground">Rekonise</span>
      </Link>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button type="button" variant="ghost" size="icon-sm" onClick={onToggle} className="text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground" aria-label="Thu gọn sidebar">
            <ChevronLeft className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>Thu gọn sidebar</TooltipContent>
      </Tooltip>
    </div>
  )
}

export function MobileBrand() {
  return (
    <Link href="/member" className="flex min-w-0 items-center gap-2.5">
      <BrandMark className="size-8" />
      <span className="truncate text-[19px] font-semibold tracking-[-0.02em]">Rekonise</span>
      <ChevronRight className="sr-only" />
    </Link>
  )
}
