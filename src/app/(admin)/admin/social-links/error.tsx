"use client"

import { Button } from "@/components/ui/button"

export default function AdminSocialLinksError({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="max-w-md rounded-lg border bg-card p-6 text-center">
        <h2 className="font-semibold text-lg">
          Không tải được Social Links
        </h2>
        <p className="mt-2 text-muted-foreground text-sm">{error.message}</p>
        <Button className="mt-4" onClick={reset}>
          Thử lại
        </Button>
      </div>
    </main>
  )
}
