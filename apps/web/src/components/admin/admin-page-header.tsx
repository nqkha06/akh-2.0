import type { ReactNode } from "react"

import {
  AdminBreadcrumbs,
  type AdminBreadcrumbItem,
} from "@/components/admin/admin-breadcrumbs"
import { cn } from "@/lib/utils"

type AdminPageHeaderProps = {
  title: ReactNode
  description?: ReactNode
  leading?: ReactNode
  meta?: ReactNode
  actions?: ReactNode
  breadcrumbs?: readonly AdminBreadcrumbItem[] | false
  className?: string
}

export function AdminPageHeader({
  title,
  description,
  leading,
  meta,
  actions,
  breadcrumbs,
  className,
}: AdminPageHeaderProps) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-3", className)}>
      {breadcrumbs !== false ? (
        <AdminBreadcrumbs items={breadcrumbs || undefined} />
      ) : null}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          {leading ? <div className="shrink-0">{leading}</div> : null}
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h1 className="min-w-0 truncate text-2xl font-semibold tracking-[-0.03em]">
                {title}
              </h1>
              {meta}
            </div>
            {description ? (
              <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        ) : null}
      </header>
    </div>
  )
}
