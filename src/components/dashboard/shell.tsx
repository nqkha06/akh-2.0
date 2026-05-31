"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ChevronDown,
  ChevronLeft,
  CircleHelp,
  CloudUpload,
  Crown,
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
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

import { CreateLinkDialog } from "@/components/create-link-dialog";

const navGroups = [
  {
    label: "Tổng quan",
    items: [{ href: "/", label: "Bảng tổng quan", icon: Gauge }],
  },
  {
    label: "Kiếm tiền",
    items: [
      { href: "/links", label: "Quản lí liên kết", icon: Link2 },
      { href: "/levels", label: "Cấp độ kiếm tiền", icon: Network },
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

const flatNav = navGroups.flatMap((group) => group.items);

const partners = [
  { label: "VuotNhanh", icon: Zap, tone: "from-amber-300 to-yellow-400" },
  { label: "ZuFile", icon: CloudUpload, tone: "from-sky-400 to-blue-600" },
];

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <div className="grid size-11 place-items-center rounded-lg bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 text-white shadow-[0_14px_30px_rgba(79,70,229,0.28)]">
        <LockKeyhole size={24} strokeWidth={2.6} />
      </div>
      <div>
        <span className="block text-[23px] font-bold tracking-normal text-slate-950">
          Link4Sub
        </span>
        <span className="text-xs font-semibold text-slate-400">
          Affiliate OS
        </span>
      </div>
    </Link>
  );
}

function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href;
}

function NavItem({ item }: { item: (typeof flatNav)[number] }) {
  const pathname = usePathname();
  const active = isActivePath(pathname, item.href);

  return (
    <Link
      href={item.href}
      className={`group flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[15px] font-semibold transition-all duration-200 ${
        active
          ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-[0_12px_28px_rgba(37,99,235,0.24)]"
          : "text-slate-600 hover:bg-white hover:text-slate-950 hover:shadow-sm"
      }`}
    >
      <span
        className={`grid size-8 shrink-0 place-items-center rounded-xl transition ${
          active
            ? "bg-white/18 text-white"
            : "bg-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600"
        }`}
      >
        <item.icon size={18} strokeWidth={2} />
      </span>
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {item.badge ? (
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
            active ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-700"
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
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[296px] border-r border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_56%,#f6f8fb_100%)] lg:block">
      <div className="relative flex h-full flex-col overflow-hidden px-4 py-5">
        <div className="relative">
          <Logo />
          <button
            className="absolute -right-8 top-1 grid size-8 cursor-pointer place-items-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-[0_10px_24px_rgba(15,23,42,0.08)]"
            aria-label="Thu gọn sidebar"
          >
            <ChevronLeft size={17} />
          </button>
        </div>

        <nav className="relative mt-8 space-y-6 overflow-y-auto pr-1">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                {group.label}
              </p>
              <div className="space-y-1.5">
                {group.items.map((item) => (
                  <NavItem key={item.href} item={item} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="relative mt-auto pt-5">
          <div className="mb-4 border-t border-slate-200/80 pt-4">
            <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
              Đối tác
            </p>
            <div className="space-y-1">
              {partners.map((partner) => (
                <a
                  key={partner.label}
                  href="#"
                  className="flex min-h-10 items-center gap-3 rounded-xl px-2 py-2 text-sm font-bold text-slate-600 transition hover:bg-white hover:text-slate-950"
                >
                  <span
                    className={`grid size-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br ${partner.tone} text-white`}
                  >
                    <partner.icon size={17} strokeWidth={2.2} />
                  </span>
                  {partner.label}
                </a>
              ))}
            </div>
          </div>
          <div className="border-t border-slate-200/80 pt-4">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-slate-900 font-bold text-white">
                Q
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-800">qkha</p>
                <p className="truncate text-xs font-semibold text-slate-400">
                  Pro affiliate
                </p>
              </div>
            </div>
            <div className="mt-4 h-2 rounded-full bg-slate-200">
              <div className="h-2 w-[68%] rounded-full bg-gradient-to-r from-emerald-400 to-sky-400" />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="sticky top-[72px] z-20 border-b border-slate-200/80 bg-[#f6f8ff]/92 px-4 py-3 backdrop-blur-xl lg:hidden">
      <div className="flex gap-2 overflow-x-auto">
        {flatNav.map((item) => {
          const active = isActivePath(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm font-bold transition ${
                active
                  ? "bg-slate-950 text-white"
                  : "bg-white text-slate-600 shadow-sm"
              }`}
            >
              <item.icon size={15} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function Topbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-30 h-[72px] border-b border-slate-200/80 bg-white/85 backdrop-blur-2xl lg:left-[296px]">
      <div className="flex h-full items-center gap-4 px-4 sm:px-6 lg:px-8">
        <div className="min-w-0 lg:hidden">
          <Logo />
        </div>

        <div className="hidden min-w-0 lg:block">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
            Xin chào qkha
          </p>
          <h1 className="truncate text-lg font-bold text-slate-950 sm:text-xl">
            Chào mừng trở lại
          </h1>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden lg:block">
            <CreateLinkDialog />
          </div>

          <button
            className="relative grid size-10 cursor-pointer place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:text-blue-600 hover:shadow-[0_2px_6px_rgba(15,23,42,0.08)]"
            aria-label="Thông báo"
          >
            <Bell size={20} strokeWidth={1.9} />
            <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-emerald-500" />
          </button>

          <div className="relative lg:hidden">
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-2 pr-3 text-sm font-bold text-slate-700"
            >
              <span className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-xs font-bold text-white">
                Q
              </span>
              qkha
              <ChevronDown size={16} className="text-slate-400" />
            </button>
            {menuOpen ? (
              <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-slate-200/80 bg-white p-2 shadow-[0_18px_30px_rgba(15,23,42,0.12)]">
                {[
                  ["/account", "Tài khoản"],
                  ["/loyalty", "Thân thiết"],
                  ["/support", "Hỗ trợ"],
                ].map(([href, label]) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    {label}
                  </Link>
                ))}
                <button
                  className="mt-1 w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                  onClick={() => setMenuOpen(false)}
                >
                  Đăng xuất
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}

function DashboardFooter() {
  return (
    <footer className="border-t border-slate-200/80 px-4 py-5 text-sm font-semibold text-slate-500 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p>© 2026 Link4Sub. Nền tảng quản lý link SUB to unlock.</p>
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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#eef2ff,_transparent_45%),radial-gradient(circle_at_bottom,_#ecfeff,_transparent_40%),linear-gradient(180deg,#f8fafc_0%,#f3f6fb_100%)] text-slate-900">
      <Sidebar />
      <Topbar />
      <MobileNav />
      <section className="flex min-h-screen flex-col pt-[72px] lg:ml-[296px]">
        <div className="flex-1 px-4 pb-12 pt-6 sm:px-6 lg:px-8">{children}</div>
        <DashboardFooter />
      </section>
    </main>
  );
}

export function DashboardShell({ children }: { children: ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}
