"use client"

import { useTransition, type ReactNode } from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { useLocale, useTranslations } from "next-intl"
import {
  CircleHelp,
  Languages,
  Laptop,
  LogOut,
  MonitorCog,
  Moon,
  MoreHorizontal,
  Settings,
  Sun,
  User,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { localeCookieName, locales, type AppLocale } from "@/i18n/config"
import { cn } from "@/lib/utils"

const account = {
  name: "Hayden Bleasel",
  email: "example@email.com",
  image: "https://github.com/haydenbleasel.png",
  initials: "HB",
}

function AccountAvatar({ className }: { className?: string }) {
  return (
    <Avatar className={cn("size-8", className)}>
      <AvatarImage src={account.image} alt={account.name} />
      <AvatarFallback>{account.initials}</AvatarFallback>
    </Avatar>
  )
}

function UserMenuContent() {
  const t = useTranslations("Dashboard")
  const { theme = "system", setTheme } = useTheme()
  const locale = useLocale() as AppLocale
  const [isChangingLocale, startLocaleTransition] = useTransition()

  const localeLabels: Record<AppLocale, string> = { vi: "Tiếng Việt", en: "English" }

  const handleLocaleChange = (value: string) => {
    const nextLocale = locales.find((item) => item === value)
    if (!nextLocale || nextLocale === locale) return

    document.cookie = [
      `${localeCookieName}=${nextLocale}`,
      "path=/",
      "max-age=31536000",
      "samesite=lax",
    ].join("; ")

    startLocaleTransition(() => window.location.reload())
  }

  return (
    <DropdownMenuContent align="end" sideOffset={8} className="w-64 rounded-lg p-1.5">
      <DropdownMenuLabel className="px-2 py-2 font-normal">
        <div className="flex min-w-0 items-center gap-3">
          <AccountAvatar className="size-9" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{account.name}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{account.email}</p>
          </div>
        </div>
      </DropdownMenuLabel>

      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem asChild>
          <Link href="/member/account">
            <User className="size-4" />
            {t("topbar.editProfile")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/member/account">
            <Settings className="size-4" />
            {t("topbar.accountSettings")}
          </Link>
        </DropdownMenuItem>
      </DropdownMenuGroup>

      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <MonitorCog className="size-4" />
          <span className="flex-1">{t("topbar.theme")}</span>
          <span className="mr-1 text-xs text-muted-foreground">{t(`topbar.${theme === "dark" ? "dark" : theme === "light" ? "light" : "system"}`)}</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="min-w-40">
          <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
            <DropdownMenuRadioItem value="light"><Sun className="size-4" />{t("topbar.light")}</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark"><Moon className="size-4" />{t("topbar.dark")}</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="system"><Laptop className="size-4" />{t("topbar.system")}</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuSubContent>
      </DropdownMenuSub>

      <DropdownMenuSub>
        <DropdownMenuSubTrigger disabled={isChangingLocale}>
          <Languages className="size-4" />
          <span className="flex-1">{t("topbar.language")}</span>
          <span className="mr-1 text-xs text-muted-foreground">{localeLabels[locale]}</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="min-w-40">
          <DropdownMenuRadioGroup value={locale} onValueChange={handleLocaleChange}>
            {locales.map((item) => (
              <DropdownMenuRadioItem key={item} value={item} disabled={isChangingLocale}>
                {localeLabels[item]}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuSubContent>
      </DropdownMenuSub>

      <DropdownMenuItem asChild>
        <Link href="/member/support"><CircleHelp className="size-4" />{t("nav.support")}</Link>
      </DropdownMenuItem>

      <DropdownMenuSeparator />
      <DropdownMenuItem variant="destructive">
        <LogOut className="size-4" />
        {t("topbar.logout")}
      </DropdownMenuItem>
    </DropdownMenuContent>
  )
}

export function UserMenu({ children }: { children?: ReactNode }) {
  const t = useTranslations("Dashboard")
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            {children ?? (
              <Button type="button" variant="ghost" size="icon" className="size-9 rounded-lg p-0" aria-label={t("topbar.userMenu")}>
                <AccountAvatar />
              </Button>
            )}
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={7}>{t("topbar.userMenu")}</TooltipContent>
      </Tooltip>
      <UserMenuContent />
    </DropdownMenu>
  )
}

export function SidebarAccountMenu({ collapsed = false }: { collapsed?: boolean }) {
  const trigger = collapsed ? (
    <Button type="button" variant="ghost" size="icon" className="mx-auto size-10 rounded-lg p-0" aria-label="Mở menu tài khoản">
      <AccountAvatar />
    </Button>
  ) : (
    <button type="button" className="flex h-12 w-full items-center gap-2.5 rounded-lg px-2 text-left transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring">
      <AccountAvatar />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-sidebar-foreground">{account.name}</span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">{account.email}</span>
      </span>
      <MoreHorizontal className="size-4 shrink-0 text-muted-foreground" />
    </button>
  )

  return <UserMenu>{trigger}</UserMenu>
}
