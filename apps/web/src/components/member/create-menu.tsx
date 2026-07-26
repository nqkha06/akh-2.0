"use client"

import { useTranslations } from "next-intl"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export function CreateMenu() {
  const t = useTranslations("Dashboard")

  return (
      <Tooltip>
        <TooltipTrigger asChild>
            <Button type="button" className="h-10 rounded-lg px-3 text-sm font-medium shadow-none" aria-label={t("create.title")}>
              <Plus className="size-4" />
              <span className="">{t("create.title")}</span>
            </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={7} className="sm:hidden">{t("create.title")}</TooltipContent>
      </Tooltip>

  )
}
