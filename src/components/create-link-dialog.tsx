"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

import SocialLinksGenerator from "@/app/create/demo"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function CreateLinkDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        onClick={() => setOpen(true)}
        className="flex h-11 cursor-pointer items-center gap-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 px-4 text-sm font-bold text-white shadow-[0_6px_16px_rgba(37,99,235,0.18)] transition hover:shadow-[0_8px_20px_rgba(37,99,235,0.22)]"
      >
        <Plus size={18} strokeWidth={2.3} />
        Tạo mới
      </Button>
      <DialogContent className="z-[100] max-h-[calc(100vh-24px)] max-w-[calc(100vw-24px)] gap-0 overflow-y-auto rounded-lg bg-gray-50 p-0 sm:max-w-[min(1180px,calc(100vw-24px))]">
        <DialogHeader className="sticky top-0 z-20 border-b border-gray-200 bg-white/92 px-5 py-4 backdrop-blur-xl">
          <DialogTitle className="text-lg font-semibold text-gray-900">
            Tạo link SUB to unlock
          </DialogTitle>
        </DialogHeader>
        <SocialLinksGenerator embedded />
      </DialogContent>
    </Dialog>
  )
}
