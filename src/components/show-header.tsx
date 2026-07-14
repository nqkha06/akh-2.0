"use client";

import Link from "next/link";
import { ArrowRight, Home, Link2, Menu, Plus, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
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

export function ShowHeader({ onShare }: { onShare?: () => void }) {
  return (
    <header className="sticky top-3 z-40 px-3 pt-3 text-white sm:top-5 sm:px-6 sm:pt-5">
      <div className="mx-auto flex min-h-16 max-w-5xl items-center justify-between gap-3  p-2  sm:min-h-20 sm:p-3">
        <Link
          href="/member"
          aria-label="STU home"
          className="group flex h-12 min-w-0 items-center rounded-full border border-white/20 bg-white/10 pr-3 transition-colors hover:bg-white/15 sm:h-14 sm:pr-5"
        >
          <span className="ml-1 grid size-10 shrink-0 place-items-center rounded-full bg-white/90 text-slate-950 shadow-sm transition-transform group-hover:scale-[1.03] sm:size-12">
            <Link2 className="size-5" />
          </span>
          <span className="ml-3 min-w-0">
            <span className="block whitespace-nowrap text-base font-black tracking-tight sm:text-xl">
              Link4Sub
            </span>
            {/* <span className="hidden text-xs font-semibold uppercase tracking-[0.14em] text-white/65 md:block">
              .com
            </span> */}
          </span>
        </Link>

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

        <div className="flex h-12 shrink-0 items-center gap-1.5 rounded-full border border-white/15 bg-black/25 p-1.5 sm:h-14 sm:gap-2 sm:p-2">
          {onShare ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Share this page"
              onClick={onShare}
              className="size-9 rounded-full text-white hover:bg-white/15 hover:text-white sm:size-10"
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
                className="size-9 rounded-full text-white hover:bg-white/15 hover:text-white sm:size-10 lg:hidden"
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
                  <span className="grid size-10 place-items-center rounded-xl bg-slate-950 text-white">
                    <Link2 className="size-5" />
                  </span>
                  STU Links
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
