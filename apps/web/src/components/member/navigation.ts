import type { LucideIcon } from "lucide-react"
import {
  Bell,
  CircleHelp,
  FileText,
  Folder,
  Gauge,
  Link2,
  Trophy,
  User,
  Users,
  Wallet,
} from "lucide-react"

export type NavigationItem = {
  titleKey:
    | "nav.overview"
    | "nav.links"
    | "nav.files"
    | "nav.bio"
    | "nav.withdraw"
    | "nav.referrals"
    | "nav.loyalty"
    | "nav.account"
    | "nav.support"
    | "nav.announcements"
  href: string
  icon: LucideIcon
  permission?: string
  activePrefixes?: string[]
  badge?: string
}

export type NavigationGroup = {
  labelKey: "groups.overview" | "groups.content" | "groups.monetization" | "groups.community" | "groups.system"
  items: NavigationItem[]
}

export const navigationGroups: NavigationGroup[] = [
  {
    labelKey: "groups.overview",
    items: [{ titleKey: "nav.overview", href: "/member", icon: Gauge }],
  },
  {
    labelKey: "groups.content",
    items: [
      {
        titleKey: "nav.links",
        href: "/member/links",
        icon: Link2,
        activePrefixes: ["/member/links", "/member/create"],
      },
      { titleKey: "nav.files", href: "/member/files", icon: Folder },
      { titleKey: "nav.bio", href: "/member/bio", icon: FileText },
    ],
  },
  {
    labelKey: "groups.monetization",
    items: [
      { titleKey: "nav.withdraw", href: "/member/withdraw", icon: Wallet },
    ],
  },
  {
    labelKey: "groups.community",
    items: [
      { titleKey: "nav.referrals", href: "/member/referrals", icon: Users },
      { titleKey: "nav.loyalty", href: "/member/loyalty", icon: Trophy },
    ],
  },
  {
    labelKey: "groups.system",
    items: [
      { titleKey: "nav.announcements", href: "/member/announcements", icon: Bell },
      { titleKey: "nav.account", href: "/member/account", icon: User },
      { titleKey: "nav.support", href: "/member/support", icon: CircleHelp },
    ],
  },
]

export function isNavigationItemActive(pathname: string, item: NavigationItem) {
  if (item.href === "/member") return pathname === "/member"

  const prefixes = item.activePrefixes ?? [item.href]
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

export function getVisibleNavigationGroups(canAccess?: (permission: string) => boolean) {
  return navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.permission || !canAccess || canAccess(item.permission)),
    }))
    .filter((group) => group.items.length > 0)
}
