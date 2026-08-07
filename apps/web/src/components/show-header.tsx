"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { ArrowRight, Moon, Plus, Share2, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  SiteBrandLink,
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
            : "size-10 rounded-xl text-slate-600 shadow-none hover:bg-black/5 hover:text-slate-950 dark:text-white/75 dark:hover:bg-white/10 dark:hover:text-white"}
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
    <header className="sticky top-0 z-40 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] text-slate-950 sm:px-6 sm:pt-5">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-2 rounded-2xl border border-white/45 bg-white/78 px-2 shadow-[0_12px_36px_rgba(2,6,23,0.12)] backdrop-blur-2xl dark:border-white/15 dark:bg-slate-950/65 dark:text-white dark:shadow-[0_12px_36px_rgba(0,0,0,0.22)] sm:h-16 sm:px-2.5">
        <SiteBrandLink
          href="/"
          className="group flex h-10 min-w-0 items-center rounded-xl pr-2 transition-opacity hover:opacity-80 sm:h-11 sm:pr-3"
          logoClassName="size-9 rounded-xl bg-white shadow-sm ring-1 ring-black/5 transition-transform group-hover:scale-[1.03] sm:size-10"
          nameClassName="ml-1.5 max-w-28 truncate whitespace-nowrap text-sm font-bold tracking-[-0.025em] sm:max-w-none sm:text-base"
        />

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <PublicThemeSelector variant="default" />

          {onShare ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={publicT("sharePage")}
              onClick={onShare}
              className="size-10 rounded-xl text-slate-600 shadow-none hover:bg-black/5 hover:text-slate-950 dark:text-white/75 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <Share2 className="size-4" />
            </Button>
          ) : null}

          <span className="mx-1 h-5 w-px bg-black/10 dark:bg-white/15" aria-hidden />

          <Button
            asChild
            className="size-10 rounded-xl bg-slate-950 p-0 text-white shadow-sm hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-white/90 sm:h-10 sm:w-auto sm:px-3.5"
          >
            <Link href="/member/create">
              <Plus className="size-4 sm:hidden" />
              <span className="hidden text-xs font-semibold sm:inline">{publicT("createHeader")}</span>
              <ArrowRight className="hidden size-3.5 sm:block" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
