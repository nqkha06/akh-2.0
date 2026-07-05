"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ChevronDown,
  CircleHelp,
  CloudUpload,
  Crown,
  Folder,
  Gauge,
  Gift,
  Link2,
  LockKeyhole,
  Network,
  Sparkles,
  Trophy,
  User,
  Wallet,
  Zap,
  LogOut,
  Settings,
  CreditCard,
  Sun,
  Moon,
} from "lucide-react";
import type { ReactNode } from "react";
import { useTheme } from "next-themes";

import { CreateLinkDialog } from "@/components/create-link-dialog";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"

const navGroups = [
  {
    label: "Tổng quan",
    items: [{ href: "/", label: "Bảng tổng quan", icon: Gauge }],
  },
  {
    label: "Kiếm tiền",
    items: [
      { href: "/links", label: "Sub to Unlock", icon: Link2 },
      { href: "/files", label: "Files", icon: Folder },
      { href: "/bio", label: "Link-in-bio", icon: Folder },
      { href: "/levels", label: "Kiếm tiền", icon: Network },
      { href: "/withdraw", label: "Rút tiền", icon: Wallet },
    ],
  },
  {
    label: "Cộng đồng",
    items: [
      { href: "/referrals", label: "Giới thiệu", icon: Gift },
      { href: "/new", label: "New", icon: Sparkles, badge: "New" },
      { href: "/loyalty", label: "Thân thiết", icon: Trophy },
      { href: "/leaderboard", label: "Bảng xếp hạng", icon: Crown },
    ],
  },
  {
    label: "Tài khoản & hỗ trợ",
    items: [
      { href: "/account", label: "Tài khoản", icon: User },
      { href: "/support", label: "Hỗ trợ", icon: CircleHelp },
    ],
  },
];

type NavItemData = (typeof navGroups)[number]["items"][number];

const partners = [
  { label: "VuotNhanh", icon: Zap, tone: "bg-amber-50 text-amber-700 ring-amber-100" },
  { label: "ZuFile", icon: CloudUpload, tone: "bg-blue-50 text-blue-700 ring-blue-100" },
];

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3">
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
  return href === "/" ? pathname === "/" : pathname === href;
}

function NavItem({ item }: { item: NavItemData }) {
  const pathname = usePathname();
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
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {item.badge ? (
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${active ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
            }`}
        >
          {item.badge}
        </span>
      ) : null}
    </Link>
  );
}

function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[288px] border-r border-slate-200 bg-white lg:block">
      <div className="relative flex h-full flex-col overflow-hidden px-4 py-4">
        <div className="relative">
          <Logo />

        </div>

        <nav className="relative mt-6 space-y-4 overflow-y-auto pr-1">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="mb-1.5 px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavItem key={item.href} item={item} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="relative mt-auto pt-4">
          <div className="mb-3 border-t border-slate-200/80 pt-3">
            <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
              Đối tác
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

        </div>
      </div>
    </aside>
  );
}

function Topbar() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <header className="fixed top-0 left-0 right-0 z-30 h-18 border-b border-slate-200/80 bg-white/90 backdrop-blur-2xl dark:border-slate-800/80 dark:bg-slate-950/80 lg:left-72">
      <div className="flex h-full items-center gap-4 px-4 sm:px-6 lg:px-8">
        <div className="min-w-0 lg:hidden">
          <Logo />
        </div>

        <div className="hidden min-w-0 lg:block">
          <div className="hidden lg:block">
            <CreateLinkDialog />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3">

          <button
            className="relative grid size-10 cursor-pointer place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:text-blue-600 hover:shadow-[0_2px_6px_rgba(15,23,42,0.08)]"
            aria-label="Thông báo"
          >
            <Bell size={20} strokeWidth={1.9} />
            <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-emerald-500" />
          </button>

          <div className="relative">

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-2 pr-3 text-sm font-bold text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                >
                  <span className="grid size-8 place-items-center rounded-full bg-blue-600 text-xs font-bold text-white">
                    Q
                  </span>
                  Kha
                  <ChevronDown size={16} className="text-slate-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 border-slate-200 bg-white text-slate-950 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage alt="@haydenbleasel" src="https://github.com/haydenbleasel.png" />
                      <AvatarFallback>HB</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-1">
                      <p className="font-medium text-sm leading-none">Hayden Bleasel</p>
                      <div className="flex justify-center items-center gap-2">
                        <p className="text-muted-foreground text-xs leading-none">example@email.com</p>
                        <Badge className="w-fit text-xs" variant="secondary">
                          Pro
                        </Badge>
                      </div>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="flex items-center justify-between gap-4"
                  onSelect={(event) => event.preventDefault()}
                >
                  <div className="flex items-center gap-2">
                    {isDark ? <Moon /> : <Sun />}
                    Theme
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {isDark ? "Dark" : "Light"}
                    </span>
                    <Switch
                      checked={isDark}
                      onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                      aria-label="Toggle dark mode"
                    />
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />

                <DropdownMenuItem>
                  <User />
                  Edit Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <CreditCard />
                  Subscription
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings />
                  Account Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive">
                  <LogOut />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>


          </div>
        </div>
      </div>
    </header>
  );
}

function DashboardFooter() {
  return (
    <footer className="border-t border-slate-200/80 px-4 py-5 text-sm font-semibold text-slate-500 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 md:flex-row items-center md:justify-between">
        <p>© 2026 Rekonise.</p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link href="/support" className="transition hover:text-slate-950">
            Hỗ trợ
          </Link>
          <Link href="/account" className="transition hover:text-slate-950">
            Tài khoản
          </Link>
          <Link href="/leaderboard" className="transition hover:text-slate-950">
            Bảng xếp hạng
          </Link>
        </div>
      </div>
    </footer>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Sidebar />
      <Topbar />
      <section className="flex min-h-screen flex-col pt-18 lg:ml-72">
        <div className="flex-1 px-4 pb-12 pt-6 sm:px-6 lg:px-8">{children}</div>
        <DashboardFooter />
      </section>
    </main>
  );
}

export function DashboardShell({ children }: { children: ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}
