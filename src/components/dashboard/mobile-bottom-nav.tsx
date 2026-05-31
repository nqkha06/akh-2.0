"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Home, LifeBuoy, Link2, PlusCircle, User } from "lucide-react"

import SocialLinksGenerator from "@/app/create/demo"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function MobileBottomNav() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 mb-2 pb-[env(safe-area-inset-bottom)] lg:hidden">
        <div className="mx-auto max-w-6xl px-3">
          <div className="flex items-center justify-between gap-2 rounded-2xl border border-gray-200/80 bg-white/70 px-3 py-2 shadow-[0_12px_30px_rgba(15,23,42,0.12)] backdrop-blur-xl">
            <Link
              href="/"
              className="group flex flex-1 cursor-pointer flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-medium text-gray-600 transition-colors hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
            >
              <Home className="h-5 w-5 transition-transform group-hover:-translate-y-0.5" />
              Home
            </Link>
            <Link
              href="/links"
              className="group flex flex-1 cursor-pointer flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-medium text-gray-600 transition-colors hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
            >
              <Link2 className="h-5 w-5 transition-transform group-hover:-translate-y-0.5" />
              Links
            </Link>
            <div className="flex flex-1 flex-col items-center">
              <button
                onClick={() => setOpen(true)}
                className="group -mt-7 flex h-14 w-14 cursor-pointer items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 text-white shadow-[0_12px_25px_rgba(16,185,129,0.45)] ring-1 ring-white/70 transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
              >
                <PlusCircle className="h-6 w-6" />
              </button>
              <span className="mt-1 text-[11px] font-semibold text-emerald-600">Create</span>
            </div>
            <Link
              href="/support"
              className="group flex flex-1 cursor-pointer flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-medium text-gray-600 transition-colors hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
            >
              <LifeBuoy className="h-5 w-5 transition-transform group-hover:-translate-y-0.5" />
              Support
            </Link>
            <Link
              href="/account"
              className="group flex flex-1 cursor-pointer flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-medium text-gray-600 transition-colors hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
            >
              <User className="h-5 w-5 transition-transform group-hover:-translate-y-0.5" />
              Account
            </Link>
          </div>
        </div>
      </nav>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="h-[100dvh] w-[100dvw] max-w-none gap-0 overflow-y-auto rounded-none border-none bg-gray-50 p-0">
          <DialogHeader className="sticky top-0 z-20 flex flex-row items-center gap-3 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur-xl">
            <button
              onClick={() => setOpen(false)}
              className="grid size-9 place-items-center rounded-full border border-gray-200 bg-white text-gray-600"
              aria-label="Quay lại"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <DialogTitle className="text-base font-semibold text-gray-900">
              Tạo link SUB to unlock
            </DialogTitle>
          </DialogHeader>
          <SocialLinksGenerator embedded />
        </DialogContent>
      </Dialog>
    </>
  )
}
