import { ExternalLink, ShieldCheck } from "lucide-react"
import Link from "next/link"

const footerLinks = [
  { href: "/admin", label: "Dashboard", external: false },
  { href: "/", label: "Xem website", external: true },
] as const

export function AdminFooter() {
  return (
    <footer className="mt-auto border-t bg-background/80 px-4 py-5 lg:px-6">
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="size-4 shrink-0" aria-hidden="true" />
          <p>
            © {new Date().getFullYear()} Linkicom
            <span className="hidden sm:inline"> · Admin Console</span>
          </p>
        </div>

        <nav
          aria-label="Điều hướng footer quản trị"
          className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground"
        >
          {footerLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              target={item.external ? "_blank" : undefined}
              rel={item.external ? "noreferrer" : undefined}
              className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
            >
              {item.label}
              {item.external ? (
                <ExternalLink className="size-3.5" aria-hidden="true" />
              ) : null}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}
