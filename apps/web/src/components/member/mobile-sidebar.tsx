"use client"

import { useTranslations } from "next-intl"

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useSiteBrand } from "@/features/site-settings/components/site-brand-provider"
import { MobileBrand } from "./sidebar-brand"
import { SidebarNavigation } from "./sidebar-navigation"

export function MobileSidebar({
  open,
  onOpenChange,
  canAccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  canAccess?: (permission: string) => boolean
}) {
  const t = useTranslations("Dashboard")
  const brand = useSiteBrand()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="flex w-[min(300px,86vw)] flex-col gap-0 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground shadow-none" showCloseButton>
        <SheetHeader className="flex h-[var(--header-height)] justify-center border-b border-sidebar-border px-4 py-0 pr-12 text-left">
          <SheetTitle className="sr-only">{t("sidebar.mobileTitle", { brand: brand.siteName })}</SheetTitle>
          <SheetDescription className="sr-only">{t("sidebar.mobileDescription", { brand: brand.siteName })}</SheetDescription>
          <MobileBrand />
        </SheetHeader>
        <SidebarNavigation onNavigate={() => onOpenChange(false)} canAccess={canAccess} />
      </SheetContent>
    </Sheet>
  )
}
