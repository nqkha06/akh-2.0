"use client"

import { useTranslations } from "next-intl"
import { Menu } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { CreateMenu } from "./create-menu"
import { NotificationsPopover } from "./notifications-popover"
import { UserMenu } from "./user-menu"

export function AppHeader({
  onOpenMobileSidebar,
}: {
  onOpenMobileSidebar: () => void
}) {
  const t = useTranslations("Dashboard")

  return (
    <header className="sticky top-0 z-40 flex h-[var(--header-height)] shrink-0 items-center border-b border-border bg-background/95 px-3 backdrop-blur-sm supports-[backdrop-filter]:bg-background/85 sm:px-5 lg:px-6">
      <div className="flex min-w-0 flex-1 items-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button type="button" variant="ghost" size="icon" onClick={onOpenMobileSidebar} className="size-11 shrink-0 rounded-lg lg:hidden" aria-label={t("sidebar.open")}>
              <Menu className="size-[19px]" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={7}>{t("sidebar.open")}</TooltipContent>
        </Tooltip>

      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-1.5">
        <CreateMenu />
        <NotificationsPopover />
        <UserMenu />
      </div>
    </header>
  )
}
