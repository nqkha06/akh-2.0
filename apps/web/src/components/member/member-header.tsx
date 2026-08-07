"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { LoaderCircle, Menu, ShieldAlert } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { CreateMenu } from "./create-menu"
import { NotificationsPopover } from "./notifications-popover"
import { UserMenu } from "./user-menu"
import { stopImpersonatingAndRedirect } from "@/features/auth/api/auth.client"
import { useAuthUser } from "@/features/auth/components/auth-user-provider"

export function MemberHeader({
  onOpenMobileSidebar,
}: {
  onOpenMobileSidebar: () => void
}) {
  const t = useTranslations("Dashboard")
  const currentUser = useAuthUser()
  const [stoppingImpersonation, setStoppingImpersonation] = useState(false)

  const stopImpersonation = async () => {
    setStoppingImpersonation(true)
    try {
      await stopImpersonatingAndRedirect()
    } catch (error) {
      setStoppingImpersonation(false)
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể quay lại khu vực admin.",
      )
    }
  }

  return (
    <div className="shrink-0">
      {currentUser.impersonation ? (
        <div className="flex min-h-10 items-center justify-between gap-3 border-b border-amber-300/60 bg-amber-50 px-3 py-1.5 text-amber-950 dark:border-amber-800 dark:bg-amber-950/45 dark:text-amber-100 sm:px-5 lg:px-6">
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <ShieldAlert className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="truncate">
              Đang đăng nhập với tư cách <span className="font-semibold">{currentUser.name}</span>
              <span className="hidden text-amber-800/75 dark:text-amber-200/70 sm:inline"> · Admin gốc: {currentUser.impersonation.actorName}</span>
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 shrink-0 border-amber-400/70 bg-background/70 px-2.5 text-xs text-amber-950 hover:bg-background dark:text-amber-100"
            disabled={stoppingImpersonation}
            onClick={() => void stopImpersonation()}
          >
            {stoppingImpersonation ? <LoaderCircle className="animate-spin" /> : null}
            Quay lại admin
          </Button>
        </div>
      ) : null}
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
        <CreateMenu />

      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-1.5">
        {/* <CreateMenu /> */}
        <NotificationsPopover />
        <UserMenu />
      </div>
    </header>
    </div>
  )
}
