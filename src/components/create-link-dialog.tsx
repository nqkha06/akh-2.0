"use client"

import { useState } from "react"
import { Pencil, Plus, FilePlus2, Lock } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
type CreateOption = {
  title: string
  description: string
  icon: React.ReactNode
  active?: boolean
  onClick?: () => void
}

const options: CreateOption[] = [
  {
    title: "Social Link",
    description: "Create a shortened link to share on social media and earn money from your content",
    icon: <Lock className="h-8 w-8" />,
    active: true,
  },
  {
    title: "Note",
    description: "Create a private note for your eyes only",
    icon: <FilePlus2 className="h-8 w-8" />,
  },
  {
    title: "Bio Link",
    description: "Create a personalized link-in-bio page to share all your content in one place",
    icon: <Pencil className="h-8 w-8" />,
  },
]

export function CreateLinkDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        onClick={() => setOpen(true)}
        className="flex h-11 cursor-pointer items-center gap-2.5 rounded-lg bg-blue-600 px-4 text-sm font-bold text-white shadow-[0_6px_16px_rgba(37,99,235,0.16)] transition hover:bg-blue-700 hover:shadow-[0_8px_20px_rgba(37,99,235,0.18)]"
      >
        <Plus size={18} strokeWidth={2.3} />
        Tạo mới
      </Button>

      <DialogContent className="md:max-w-2xl overflow-hidden rounded-2xl p-6 sm:p-8">
        <DialogHeader className="mb-6">
          <DialogTitle>
            Tạo mới
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 w-full">
          {options.map((item) => (
            <CreateOptionCard
              key={item.title}
              title={item.title}
              description={item.description}
              icon={item.icon}
              active={item.active}
              onClick={item.onClick}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function CreateOptionCard({
  title,
  description,
  icon,
  active,
  onClick,
}: CreateOption) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex h-auto w-full flex-col items-start rounded-2xl border bg-white p-5 text-left transition-all",
        "hover:-translate-y-0.5 hover:shadow-lg",
        active
          ? "border-blue-600 shadow-[0_4px_12px_rgba(37,99,235,0.25)]"
          : "border-slate-200 hover:border-slate-300"
      )}
    >
      <div
        className={cn(
          "mb-4 flex h-14 w-14 items-center justify-center rounded-full transition-colors",
          active
            ? "bg-blue-600 text-white"
            : "bg-slate-200 text-slate-500 group-hover:bg-slate-300"
        )}
      >
        {icon}
      </div>

      <h3 className="mb-2 text-xl font-bold leading-tight tracking-tight text-black">
        {title}
      </h3>

      <p className="text-sm leading-relaxed text-black/75">
        {description}
      </p>
    </button>
  )
}
