"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { FileCode2, FileUp, Link2, Plus, UserRound } from "lucide-react"

import { Button } from "@/components/ui/button"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export function CreateMenu() {
  const t = useTranslations("Dashboard")

  return (
      <Tooltip>
        <TooltipTrigger asChild>
            <Button type="button" className="h-9 rounded-lg px-2.5 text-sm font-medium shadow-none sm:px-3" aria-label={t("create.title")}>
              <Plus className="size-4" />
              <span className="">{t("create.title")}</span>
            </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={7} className="sm:hidden">{t("create.title")}</TooltipContent>
      </Tooltip>

  )
}
