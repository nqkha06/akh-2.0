"use client";

import { useTransition } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CircleHelp,
  Crown,
  Folder,
  Gauge,
  Gift,
  Link2,
  LockKeyhole,
  Network,
  Trophy,
  User,
  Wallet,
  LogOut,
  Settings,
  CreditCard,
  Sun,
  Moon,
  Languages
} from "lucide-react";
import type { ReactNode } from "react";
import { useTheme } from "next-themes";
import { useLocale, useTranslations } from "next-intl";

import { CreateLinkDialog } from "@/components/create-link-dialog";
import { MobileBottomNav } from "@/components/dashboard/mobile-bottom-nav";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch"
import {
  localeCookieName,
  locales,
  type AppLocale,
} from "@/i18n/config";

const navGroups = [
  {
    labelKey: "groups.overview",
    items: [{ href: "/member", labelKey: "nav.overview", icon: Gauge }],
  },
  {
    labelKey: "groups.monetization",
    items: [
      { href: "/member/links", labelKey: "nav.links", icon: Link2 },
      { href: "/member/files", labelKey: "nav.files", icon: Folder },
      { href: "/member/bio", labelKey: "nav.bio", icon: Folder },
      { href: "/member/levels", labelKey: "nav.levels", icon: Network },
      { href: "/member/withdraw", labelKey: "nav.withdraw", icon: Wallet },
    ],
  },
  {
    labelKey: "groups.community",
    items: [
      { href: "/member/rewards", labelKey: "nav.rewards", icon: Gift },
      { href: "/member/referrals", labelKey: "nav.referrals", icon: Gift },
      // { href: "/member/new", labelKey: "nav.new", icon: Sparkles, badgeKey: "nav.new" },
      { href: "/member/loyalty", labelKey: "nav.loyalty", icon: Trophy },
      { href: "/member/leaderboard", labelKey: "nav.leaderboard", icon: Crown },
    ],
  },
  {
    labelKey: "groups.accountSupport",
    items: [
      { href: "/member/account", labelKey: "nav.account", icon: User },
      { href: "/member/support", labelKey: "nav.support", icon: CircleHelp },
    ],
  },
];

type NavItemData = (typeof navGroups)[number]["items"][number];

function Logo() {
  return (
    <Link href="/member" className="flex items-center gap-3">
      <div className="grid size-10 place-items-center rounded-lg bg-blue-600 text-white shadow-[0_10px_22px_rgba(37,99,235,0.18)]">
        <LockKeyhole size={24} strokeWidth={2.6} />
      </div>
      <div>
        <span className="block text-[23px] font-bold tracking-normal text-slate-950">
          Rekonise
        </span>

      </div>
    </Link>
  );
}

function isActivePath(pathname: string, href: string) {
  return href === "/member" ? pathname === "/member" : pathname === href;
}

function NavItem({ item }: { item: NavItemData }) {
  const pathname = usePathname();
  const t = useTranslations("Dashboard");
  const active = isActivePath(pathname, item.href);

  return (
    <Link
      href={item.href}
      className={`group flex min-h-10 w-full items-center gap-3 rounded-lg border-l-2 px-3 py-2 text-left text-sm font-semibold transition-all duration-200 ${active
        ? "border-blue-600 bg-blue-50 text-blue-700"
        : "border-transparent text-slate-600 hover:bg-white hover:text-slate-950 hover:shadow-sm"
        }`}
    >
      <span
        className={`grid size-8 shrink-0 place-items-center rounded-lg transition ${active
          ? "bg-white text-blue-700 ring-1 ring-blue-100"
          : "bg-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600"
          }`}
      >
        <item.icon size={18} strokeWidth={2} />
      </span>
      <span className="min-w-0 flex-1 truncate">{t(item.labelKey)}</span>
      {"badgeKey" in item && item.badgeKey ? (
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${active ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
            }`}
        >
          {t(item.badgeKey as Parameters<typeof t>[0])}
        </span>
      ) : null}
    </Link>
  );
}

function Sidebar() {
  const t = useTranslations("Dashboard");

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[288px] border-r border-slate-200 bg-white lg:block">
      <div className="relative flex h-full flex-col overflow-hidden px-4 py-4">
        <div className="relative">
          <Logo />

        </div>

        <nav className="relative mt-6 space-y-4 overflow-y-auto pr-1">
          {navGroups.map((group) => (
            <div key={group.labelKey}>
              <p className="mb-1.5 px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                {t(group.labelKey)}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavItem key={item.href} item={item} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* <div className="relative mt-auto pt-4">
          <div className="mb-3 border-t border-slate-200/80 pt-3">
            <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
              {t("groups.partners")}
            </p>
            <div className="space-y-1">
              {partners.map((partner) => (
                <a
                  key={partner.label}
                  href="#"
                  className="flex min-h-9 items-center gap-3 rounded-lg px-2 py-1.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
                >
                  <span
                    className={`grid size-8 shrink-0 place-items-center rounded-lg ring-1 ${partner.tone}`}
                  >
                    <partner.icon size={17} strokeWidth={2.2} />
                  </span>
                  {partner.label}
                </a>
              ))}
            </div>
          </div>

        </div> */}
      </div>
    </aside>
  );
}

function Topbar() {
  const { resolvedTheme, setTheme } = useTheme();
  const t = useTranslations("Dashboard");
  const isDark = resolvedTheme === "dark";

  const locale = useLocale() as AppLocale;
  const [isChangingLocale, startLocaleTransition] = useTransition();

  const localeLabels: Record<AppLocale, string> = {
    vi: "Tiếng Việt",
    en: "English",
  };

  const changeLocale = (nextLocale: AppLocale) => {
    if (nextLocale === locale) {
      return;
    }

    document.cookie = [
      `${localeCookieName}=${nextLocale}`,
      "path=/",
      "max-age=31536000",
      "samesite=lax",
    ].join("; ");

    startLocaleTransition(() => {
      window.location.reload();
    });
  };

  const handleLocaleChange = (value: string) => {
    const nextLocale = locales.find((item) => item === value);

    if (!nextLocale) {
      return;
    }

    changeLocale(nextLocale);
  };

  const notifications = [
    {
      id: 1,
      icon: Link2,
      title: t("topbar.notificationItems.linkReadyTitle"),
      description: t("topbar.notificationItems.linkReadyDescription"),
      time: t("topbar.notificationItems.justNow"),
      tone: "bg-blue-50 text-blue-600",
      unread: true,
    },
    {
      id: 2,
      icon: Gauge,
      title: t("topbar.notificationItems.performanceTitle"),
      description: t("topbar.notificationItems.performanceDescription"),
      time: t("topbar.notificationItems.hoursAgo"),
      tone: "bg-emerald-50 text-emerald-600",
      unread: true,
    },
    {
      id: 3,
      icon: Folder,
      title: t("topbar.notificationItems.fileReadyTitle"),
      description: t("topbar.notificationItems.fileReadyDescription"),
      time: t("topbar.notificationItems.yesterday"),
      tone: "bg-violet-50 text-violet-600",
      unread: true,
    },
  ];
  const unreadCount = notifications.length;

  return (
    <header className="fixed inset-x-0 top-0 z-40 h-16 border-b border-border bg-background/90 backdrop-blur-xl supports-[backdrop-filter]:bg-background/75 lg:left-72">
    <div className="flex h-full items-center gap-3 px-4 sm:px-6 lg:px-8">
      {/* Mobile logo */}
      <div className="shrink-0 lg:hidden">
        <Logo />
      </div>

      {/* Desktop primary action */}
      <div className="hidden min-w-0 lg:block">
        <CreateLinkDialog />
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
    <Button
      variant="ghost"
      size="icon"
      className="size-10 rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
      aria-label={t("topbar.notifications")}
    >
      <span className="relative inline-flex">
        <Bell className="size-5" strokeWidth={1.9} />

        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute -right-1 -top-1 size-2.5 rounded-full bg-emerald-500 ring-2 ring-background"
          />
        )}
      </span>

      <span className="sr-only">
        {unreadCount} {t("topbar.unread")}
      </span>
    </Button>
  </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="max-h-[min(32rem,calc(100vh-5rem))] w-[calc(100vw-2rem)] max-w-sm overflow-y-auto p-0"
          >
            <DropdownMenuLabel className="flex items-center justify-between px-4 py-3">
              <span className="text-sm font-semibold">
                {t("topbar.notifications")}
              </span>

              <Badge className="rounded-full px-2 py-0.5 text-xs">
                {unreadCount}
              </Badge>
            </DropdownMenuLabel>

            <DropdownMenuSeparator className="my-0" />

            {notifications.length > 0 ? (
              notifications.map((notification) => {
                const Icon = notification.icon;

                return (
                  <DropdownMenuItem
                    key={notification.id}
                    className="cursor-pointer items-start gap-3 rounded-none px-4 py-3 focus:bg-accent"
                  >
                    <span
                      className={`grid size-9 shrink-0 place-items-center rounded-lg ${notification.tone}`}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-3">
                        <span className="truncate text-sm font-medium text-foreground">
                          {notification.title}
                        </span>

                        <span className="shrink-0 text-xs text-muted-foreground">
                          {notification.time}
                        </span>
                      </span>

                      <span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-muted-foreground">
                        {notification.description}
                      </span>
                    </span>

                    {notification.unread !== false && (
                      <span
                        aria-hidden="true"
                        className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
                      />
                    )}
                  </DropdownMenuItem>
                );
              })
            ) : (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                {t("topbar.noNotifications")}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Account */}
        <DropdownMenu>
           <DropdownMenuTrigger asChild>
    <Button
      variant="ghost"
      size="icon"
      className="size-11 overflow-visible rounded-full p-0"
      aria-label="Menu"
    >
      <span className="relative inline-flex">
        <Avatar className="size-10">
          <AvatarImage
            src="https://github.com/haydenbleasel.png"
            alt="Hayden Bleasel"
          />
          <AvatarFallback>HB</AvatarFallback>
        </Avatar>

        <span
          aria-hidden="true"
          className="absolute bottom-0 right-0 size-3 rounded-full bg-emerald-500 ring-2 ring-background"
        />
      </span>
    </Button>
  </DropdownMenuTrigger>


          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="w-72"
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex items-center gap-3">
                <Avatar className="size-10">
                  <AvatarImage
                    src="https://github.com/haydenbleasel.png"
                    alt="Hayden Bleasel"
                  />
                  <AvatarFallback>HB</AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium leading-none">
                    Hayden Bleasel
                  </p>

                  <div className="mt-1.5 flex items-center gap-2">
                    <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                      example@email.com
                    </p>

                    <Badge
                      variant="secondary"
                      className="shrink-0 text-[10px]"
                    >
                      Pro
                    </Badge>
                  </div>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="gap-2"
              onSelect={(event) => event.preventDefault()}
            >
              {isDark ? (
                <Moon className="size-4" aria-hidden="true" />
              ) : (
                <Sun className="size-4" aria-hidden="true" />
              )}

              <span className="flex-1">
                {t("topbar.theme")}
              </span>

              <span className="text-xs text-muted-foreground">
                {isDark ? t("topbar.dark") : t("topbar.light")}
              </span>

              <Switch
                checked={isDark}
                onCheckedChange={(checked) => {
                  setTheme(checked ? "dark" : "light");
                }}
                aria-label={t("topbar.toggleDarkMode")}
              />
            </DropdownMenuItem>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger
                disabled={isChangingLocale}
                className="gap-2"
              >
                <Languages className="size-4" aria-hidden="true" />

                <span className="flex-1">
                  {t("topbar.language")}
                </span>

                <span className="mr-2 text-xs text-muted-foreground">
                  {localeLabels[locale]}
                </span>
              </DropdownMenuSubTrigger>

              <DropdownMenuSubContent className="min-w-44">
                <DropdownMenuRadioGroup
                  value={locale}
                  onValueChange={handleLocaleChange}
                >
                  {locales.map((item) => (
                    <DropdownMenuRadioItem
                      key={item}
                      value={item}
                      disabled={isChangingLocale}
                    >
                      {localeLabels[item]}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem>
                <User className="size-4" aria-hidden="true" />
                {t("topbar.editProfile")}
              </DropdownMenuItem>

              <DropdownMenuItem>
                <CreditCard className="size-4" aria-hidden="true" />
                {t("topbar.subscription")}
              </DropdownMenuItem>

              <DropdownMenuItem>
                <Settings className="size-4" aria-hidden="true" />
                {t("topbar.accountSettings")}
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem variant="destructive">
              <LogOut className="size-4" aria-hidden="true" />
              {t("topbar.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  </header>
  );
}

function DashboardFooter() {
  const t = useTranslations("Dashboard");

  return (
    <footer className="border-t border-slate-200/80 px-4 py-5 text-sm font-semibold text-slate-500 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 md:flex-row items-center md:justify-between">
        <p>© 2026 Rekonise.</p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link href="/member/support" className="transition hover:text-slate-950">
            {t("nav.support")}
          </Link>
          <Link href="/member/account" className="transition hover:text-slate-950">
            {t("nav.account")}
          </Link>
          <Link href="/member/leaderboard" className="transition hover:text-slate-950">
            {t("nav.leaderboard")}
          </Link>
        </div>
      </div>
    </footer>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-white pb-20 text-slate-900 dark:bg-slate-950 dark:text-slate-100 lg:pb-0">
      <Sidebar />
      <Topbar />
      <section className="flex min-h-screen flex-col pt-18 lg:ml-72">
        <div className="flex-1 px-4 pb-12 pt-6 sm:px-6 lg:px-8">{children}</div>
        <DashboardFooter />
      </section>
      <MobileBottomNav />
    </main>
  );
}

function DashboardBreadcrumb({ title }: { title: string }) {
  return (
    <Breadcrumb className="mb-2">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/member">Home</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{title}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export function DashboardShell({
  children,
  pageTitle,
}: {
  children: ReactNode;
  pageTitle: string;
}) {
  return (
    <AppLayout>
      <DashboardBreadcrumb title={pageTitle} />
      {children}
    </AppLayout>
  );
}
