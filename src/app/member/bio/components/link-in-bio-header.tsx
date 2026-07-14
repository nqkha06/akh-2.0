import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"

export function LinkInBioHeader({ onCreate }: { onCreate: () => void }) {
  return (
    <header className="flex flex-col gap-4 pb-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Link-in-bio</h1>
        <p className="mt-1 text-sm text-muted-foreground">Tạo và quản lý các trang hồ sơ công khai của bạn.</p>
      </div>
      <Button type="button" onClick={onCreate} className="h-10 shrink-0 rounded-lg px-4 shadow-none">
        <Plus className="size-4" />
        Tạo trang
      </Button>
    </header>
  )
}

