"use client"

import { useTransition, type ReactNode } from "react"
import Link from "next/link"
import { signOut, useSession } from "next-auth/react"
import { useTheme } from "next-themes"
import { useLocale, useTranslations } from "next-intl"
import {
  CircleHelp,
  Languages,
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
import { useUiLanguages } from "@/features/languages/hooks/use-ui-languages"
import { logoutAllDevices } from "@/lib/api-client"
import { cn } from "@/lib/utils"

function useAccount() {
  const { data: session } = useSession()
  const name = session?.user?.name || "Tài khoản Linkicom"
  const email = session?.user?.email || ""
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "LI"

  return {
    name,
    email,
    image: session?.user?.image || undefined,
    initials,
  }
}

function AccountAvatar({ className }: { className?: string }) {
  const account = useAccount()

  return (
    <Avatar className={cn("size-8", className)}>
      <AvatarImage src={account.image} alt={account.name} />
      <AvatarFallback>{account.initials}</AvatarFallback>
    </Avatar>
  )
}

function UserMenuContent() {
  const account = useAccount()
  const t = useTranslations("Dashboard")
  const { theme = "light", setTheme } = useTheme()
  const currentTheme = theme === "dark" ? "dark" : "light"
  const locale = useLocale() as AppLocale
  const [isChangingLocale, startLocaleTransition] = useTransition()
  const [isLoggingOutAll, startLogoutAllTransition] = useTransition()
  const uiLanguages = useUiLanguages()

  const localeLabels = Object.fromEntries(
    uiLanguages.items.map((item) => [item.locale, item.label]),
  ) as Record<AppLocale, string>

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

  const handleLogoutAll = () => {
    startLogoutAllTransition(async () => {
      try {
        await logoutAllDevices()
      } finally {
        await signOut({ redirectTo: "/login" })
      }
    })
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
          <span className="mr-1 text-xs text-muted-foreground">{t(`topbar.${currentTheme}`)}</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="min-w-40">
          <DropdownMenuRadioGroup value={currentTheme} onValueChange={setTheme}>
            <DropdownMenuRadioItem value="light"><Sun className="size-4" />{t("topbar.light")}</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark"><Moon className="size-4" />{t("topbar.dark")}</DropdownMenuRadioItem>
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
            {uiLanguages.items.map((item) => (
              <DropdownMenuRadioItem key={item.locale} value={item.locale} disabled={isChangingLocale}>
                {item.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuSubContent>
      </DropdownMenuSub>

      <DropdownMenuItem asChild>
        <Link href="/member/support"><CircleHelp className="size-4" />{t("nav.support")}</Link>
      </DropdownMenuItem>

      <DropdownMenuSeparator />
      <DropdownMenuItem
        disabled={isLoggingOutAll}
        onSelect={handleLogoutAll}
      >
        <MonitorCog className="size-4" />
        {t("topbar.logoutAll")}
      </DropdownMenuItem>
      <DropdownMenuItem
        variant="destructive"
        onSelect={() => void signOut({ redirectTo: "/login" })}
      >
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
  const account = useAccount()
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
