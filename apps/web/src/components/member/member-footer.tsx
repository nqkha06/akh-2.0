"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"

import { useSiteBrand } from "@/features/site-settings/components/site-brand-provider"

const footerLinks = [
  // { href: "/member/links", labelKey: "nav.links" },
  // { href: "/member/files", labelKey: "nav.files" },
  { href: "/member/account", labelKey: "nav.account" },
  { href: "/member/support", labelKey: "nav.support" },
] as const

export function MemberFooter() {
  const t = useTranslations("Dashboard")
  const brand = useSiteBrand()

  return (
    <footer className="mt-auto bg-background/80 px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center gap-4 text-center md:flex-row md:justify-between md:text-left">
        <div className="flex min-w-0 items-center justify-center gap-3 md:justify-start">
          <p className="truncate text-sm text-muted-foreground">
            {t("footer.copyright", {
              year: new Date().getFullYear(),
              brand: brand.siteName,
            })}
          </p>
        </div>

        <nav
          aria-label={t("footer.navigation")}
          className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground md:justify-end"
        >
          {footerLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-foreground"
            >
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}
