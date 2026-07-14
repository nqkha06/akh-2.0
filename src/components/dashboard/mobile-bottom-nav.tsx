"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { Home, LifeBuoy, Link2, Plus, User } from "lucide-react"

import SocialLinksGenerator from "@/app/member/create/demo"
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function MobileBottomNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const t = useTranslations("Dashboard")
  const items = [
    { href: "/member", label: t("nav.overview"), icon: Home },
    { href: "/member/links", label: t("nav.links"), icon: Link2 },
    { href: "/member/support", label: t("nav.support"), icon: LifeBuoy },
    { href: "/member/account", label: t("nav.account"), icon: User },
  ]

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur-xl lg:hidden" aria-label="Mobile navigation">
        <div className="mx-auto grid h-16 max-w-lg grid-cols-5 items-center px-2">
          {items.slice(0, 2).map((item) => {
            const Icon = item.icon
            const active = pathname === item.href
            return (
              <Link key={item.href} href={item.href} className={cn("flex min-w-0 flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500", active ? "text-blue-600" : "text-slate-500 hover:text-slate-900")}>
                <Icon className="size-5" />
                <span className="max-w-full truncate">{item.label}</span>
              </Link>
            )
          })}

          <Button type="button" variant="ghost" onClick={() => setOpen(true)} className="-mt-5 h-auto flex-col gap-1 p-0 text-[11px] font-bold text-blue-600 hover:bg-transparent hover:text-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500" aria-label={t("nav.create")}>
            <span className="grid size-12 place-items-center rounded-2xl bg-blue-600 text-white shadow-[0_10px_24px_rgba(37,99,235,0.28)]">
              <Plus className="size-6" />
            </span>
            <span>{t("nav.create")}</span>
          </Button>

          {items.slice(2).map((item) => {
            const Icon = item.icon
            const active = pathname === item.href
            return (
              <Link key={item.href} href={item.href} className={cn("flex min-w-0 flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500", active ? "text-blue-600" : "text-slate-500 hover:text-slate-900")}>
                <Icon className="size-5" />
                <span className="max-w-full truncate">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      <Credenza open={open} onOpenChange={setOpen}>
        <CredenzaContent className="h-[100dvh] max-h-[100dvh] w-full max-w-none rounded-none">
          <CredenzaHeader className="sticky top-0 z-20 border-b bg-white/95 backdrop-blur-xl">
            <CredenzaTitle>{t("nav.create")}</CredenzaTitle>
          </CredenzaHeader>
          <CredenzaBody className="bg-slate-50 px-0">
            <SocialLinksGenerator embedded />
          </CredenzaBody>
        </CredenzaContent>
      </Credenza>
    </>
  )
}
