"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { FileCode2, FileUp, Link2, Plus, UserRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export function CreateMenu() {
  const t = useTranslations("Dashboard")
  const items = [
    { href: "/member/create", title: t("create.socialLink"), description: t("create.socialLinkDescription"), icon: Link2 },
    { href: "/member/files", title: t("create.file"), description: t("create.fileDescription"), icon: FileUp },
    { href: "/member/bio/create", title: t("create.bio"), description: t("create.bioDescription"), icon: UserRound },
    { href: "/member/links", title: t("create.unlock"), description: t("create.unlockDescription"), icon: FileCode2 },
  ]

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button type="button" className="h-9 rounded-lg px-2.5 text-sm font-medium shadow-none sm:px-3" aria-label={t("create.title")}>
              <Plus className="size-4" />
              <span className="hidden sm:inline">{t("create.title")}</span>
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={7} className="sm:hidden">{t("create.title")}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" sideOffset={8} className="w-72 rounded-lg p-1.5">
        <DropdownMenuLabel className="px-2 py-1.5 text-xs font-medium text-muted-foreground">{t("create.chooseType")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.map((item) => {
          const Icon = item.icon
          return (
            <DropdownMenuItem key={item.title} asChild className="items-start gap-3 px-2.5 py-2.5">
              <Link href={item.href}>
                <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-foreground">{item.title}</span>
                  <span className="mt-0.5 block text-xs leading-4 text-muted-foreground">{item.description}</span>
                </span>
              </Link>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
