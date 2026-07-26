"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Fragment } from "react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export type AdminBreadcrumbItem = {
  label: string
  href?: string
}

const sectionLabels: Record<string, string> = {
  users: "Users",
  "social-links": "Social Links",
  pages: "Pages",
  media: "Admin Media",
  menus: "Website Menus",
  "monetization-levels": "Monetization Levels",
  loyalty: "Loyalty Tiers",
  "payment-methods": "Payment Methods",
  withdrawals: "Withdrawals",
  languages: "Languages",
  settings: "Settings",
  roles: "Roles & Permissions",
}

const leafLabels: Record<string, string> = {
  create: "Tạo mới",
  edit: "Chỉnh sửa",
  preview: "Preview",
  appearance: "Website Settings",
  currencies: "Tiền tệ & tỷ giá",
}

export function AdminBreadcrumbs({
  items: providedItems,
}: {
  items?: readonly AdminBreadcrumbItem[]
}) {
  const pathname = usePathname()
  const items = providedItems ?? getAdminBreadcrumbs(pathname)

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap gap-1.5 overflow-hidden sm:gap-2">
        {items.map((item, index) => {
          const current = index === items.length - 1

          return (
            <Fragment key={`${item.href ?? item.label}-${index}`}>
              {index > 0 ? (
                <BreadcrumbSeparator className="shrink-0" />
              ) : null}
              <BreadcrumbItem
                className={index > 0 ? "min-w-0" : "shrink-0"}
              >
                {current ? (
                  <BreadcrumbPage className="truncate">
                    {item.label}
                  </BreadcrumbPage>
                ) : item.href ? (
                  <BreadcrumbLink asChild>
                    <Link className="truncate" href={item.href}>
                      {item.label}
                    </Link>
                  </BreadcrumbLink>
                ) : (
                  <span className="truncate text-muted-foreground">
                    {item.label}
                  </span>
                )}
              </BreadcrumbItem>
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

function getAdminBreadcrumbs(pathname: string): AdminBreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean).slice(1)

  if (segments.length === 0) {
    return [{ label: "Dashboard" }]
  }

  const [section, ...rest] = segments
  const sectionLabel = sectionLabels[section] ?? humanize(section)
  const items: AdminBreadcrumbItem[] = [
    { label: "Dashboard", href: "/admin" },
    {
      label: sectionLabel,
      href: rest.length > 0 ? `/admin/${section}` : undefined,
    },
  ]

  if (rest.length === 0) return items

  let href = `/admin/${section}`

  rest.forEach((segment, index) => {
    href += `/${segment}`
    const current = index === rest.length - 1
    const isIdentifier = /^\d+$/.test(segment)

    items.push({
      label: isIdentifier ? "Chi tiết" : leafLabels[segment] ?? humanize(segment),
      href: current ? undefined : href,
    })
  })

  return items
}

function humanize(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}
