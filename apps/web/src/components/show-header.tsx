"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { ArrowRight, Home, Menu, Moon, Plus, Share2, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  SiteBrandLink,
  SiteBrandMark,
  SiteBrandName,
} from "@/components/site-brand";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navigationItems = [
  {
    label: "Home",
    href: "/member",
  },
  {
    label: "Create",
    href: "/member/create",
  },
  {
    label: "Links",
    href: "/member/links",
  },
  {
    label: "Bio",
    href: "/member/bio",
  },
];

function PublicThemeSelector({ variant }: { variant: "default" | "linear" }) {
  const publicT = useTranslations("PublicLink");
  const { theme = "light", setTheme } = useTheme();
  const mounted = useSyncExternalStore(() => () => undefined, () => true, () => false);
  const currentTheme = mounted && theme === "dark" ? "dark" : "light";
  const ThemeIcon = currentTheme === "dark" ? Moon : Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={publicT("chooseTheme")}
          className={variant === "linear"
            ? "size-9 rounded-lg border border-border bg-card/90 text-muted-foreground shadow-none hover:bg-accent hover:text-foreground dark:border-white/10 dark:bg-[#0f1011] dark:text-[#d0d6e0] dark:hover:bg-[#18191a] dark:hover:text-white"
            : "size-9 rounded-full text-slate-700 hover:bg-black/5 hover:text-slate-950 dark:text-white dark:hover:bg-white/15 dark:hover:text-white sm:size-10"}
        >
          <ThemeIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-44">
        <DropdownMenuLabel>{publicT("appearance")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={currentTheme} onValueChange={setTheme}>
          <DropdownMenuRadioItem value="light">
            <Sun className="size-4" />
            {publicT("lightMode")}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <Moon className="size-4" />
            {publicT("darkMode")}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ShowHeader({ onShare, variant = "default" }: { onShare?: () => void; variant?: "default" | "linear" }) {
  const publicT = useTranslations("PublicLink");

  if (variant === "linear") {
    return (
      <header className="border-b border-border bg-background/90 px-4 backdrop-blur-xl dark:border-white/10 dark:bg-[#010102]/90 sm:px-6">
        <div className="mx-auto flex h-14 max-w-[1120px] items-center justify-between gap-4">
          <SiteBrandLink
            className="text-foreground dark:text-[#f7f8f8]"
            logoClassName="size-8 rounded-md"
            nameClassName="text-sm font-semibold tracking-[-0.02em]"
          />

          <div className="flex items-center gap-2">
            <PublicThemeSelector variant="linear" />

            {onShare ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={publicT("sharePage")}
                onClick={onShare}
                className="size-9 rounded-lg border border-border bg-card/90 text-muted-foreground shadow-none hover:bg-accent hover:text-foreground dark:border-white/10 dark:bg-[#0f1011] dark:text-[#d0d6e0] dark:hover:bg-[#18191a] dark:hover:text-white"
              >
                <Share2 className="size-4" />
              </Button>
            ) : null}

            <Button asChild className="hidden h-9 rounded-lg bg-[#5e6ad2] px-3.5 text-xs font-medium text-white shadow-none hover:bg-[#828fff] sm:inline-flex">
              <Link href="/member/create">
                <span className="hidden sm:inline">{publicT("createHeader")}</span>
                <span className="sm:hidden">{publicT("createShort")}</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-3 z-40 px-3 pt-3 text-slate-950 dark:text-white sm:top-5 sm:px-6 sm:pt-5">
      <div className="mx-auto flex min-h-16 max-w-5xl items-center justify-between gap-3  p-2  sm:min-h-20 sm:p-3">
        <SiteBrandLink
          href="/member"
          className="group flex h-12 min-w-0 items-center rounded-full border border-black/10 bg-white/80 pr-3 shadow-sm backdrop-blur-xl transition-colors hover:bg-white dark:border-white/20 dark:bg-white/10 dark:shadow-none dark:hover:bg-white/15 sm:h-14 sm:pr-5"
          logoClassName="ml-1 size-10 rounded-full bg-white/90 shadow-sm transition-transform group-hover:scale-[1.03] sm:size-12"
          nameClassName="ml-0.5 whitespace-nowrap text-base font-black tracking-tight sm:text-xl"
        />

        {/* <nav
          aria-label="Public page navigation"
          className="hidden items-center gap-1 rounded-full border border-white/15 bg-black/15 p-1 lg:flex"
        >
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 text-sm font-bold text-white/70 transition hover:bg-white/15 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav> */}

        <div className="flex h-12 shrink-0 items-center gap-1.5 rounded-full border border-black/10 bg-white/80 p-1.5 shadow-sm backdrop-blur-xl dark:border-white/15 dark:bg-black/25 dark:shadow-none sm:h-14 sm:gap-2 sm:p-2">
          <PublicThemeSelector variant="default" />

          {onShare ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Share this page"
              onClick={onShare}
              className="size-9 rounded-full text-slate-700 hover:bg-black/5 hover:text-slate-950 dark:text-white dark:hover:bg-white/15 dark:hover:text-white sm:size-10"
            >
              <Share2 className="size-4" />
            </Button>
          ) : null}

          <Button
            asChild
            className="hidden h-9 rounded-full bg-white px-3 text-sm font-black text-slate-950 shadow-none hover:bg-white/90 sm:inline-flex sm:h-10 sm:px-5"
          >
            <Link href="/member/create">
              <span className="hidden md:inline">Create yours</span>
              <span className="md:hidden">Create</span>
              <ArrowRight className="size-4" />
            </Link>
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open navigation menu"
                className="size-9 rounded-full text-slate-700 hover:bg-black/5 hover:text-slate-950 dark:text-white dark:hover:bg-white/15 dark:hover:text-white sm:size-10 lg:hidden"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>

            <SheetContent
              side="right"
              className="flex w-[320px] flex-col sm:w-[380px]"
            >
              <SheetHeader className="border-b">
                <SheetTitle className="flex items-center gap-3 text-left text-xl tracking-tight">
                  <SiteBrandMark className="size-10 rounded-xl" />
                  <SiteBrandName />
                </SheetTitle>
              </SheetHeader>

              <nav
                aria-label="Main navigation"
                className="flex flex-1 flex-col px-4 py-6"
              >
                {navigationItems.map((item, index) => (
                  <SheetClose key={item.href} asChild>
                    <Link
                      href={item.href}
                      className="group flex items-center justify-between border-b py-5 text-lg font-medium text-foreground transition-colors hover:text-muted-foreground"
                    >
                      <span>{item.label}</span>

                      <span className="font-mono text-xs text-muted-foreground">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </Link>
                  </SheetClose>
                ))}
              </nav>

              <div className="border-t p-4">
                <Button asChild size="lg" className="w-full rounded-full">
                  <Link href="/member/create">
                    <Plus className="size-4" />
                    Create yours
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  size="lg"
                  className="mt-2 w-full rounded-full"
                >
                  <Link href="/member">
                    <Home className="size-4" />
                    Back to dashboard
                  </Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
