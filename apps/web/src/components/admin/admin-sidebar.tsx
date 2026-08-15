"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  IconAdjustments,
  IconAward,
  IconBell,
  IconCashBanknote,
  IconChartBar,
  IconCreditCardPay,
  IconDashboard,
  IconFileDescription,
  IconFiles,
  IconFlag,
  IconLanguage,
  IconLifebuoy,
  IconLink,
  IconLockAccess,
  IconLogs,
  IconMail,
  IconMenu2,
  IconMoneybag,
  IconPhoto,
  IconSettings,
  IconShieldSearch,
  IconUser,
  IconUsers,
} from "@tabler/icons-react"
import { ChevronRight } from "lucide-react"

import { NavUser } from "@/components/nav-user"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useAdminPermissions } from "@/features/admin-authorization/components/admin-authorization-provider"
import { useAuthUser } from "@/features/auth/components/auth-user-provider"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { SiteBrandMark, SiteBrandName } from "@/components/site-brand"

type NavItem = {
  title: string
  url?: string
  icon?: React.ElementType
  permission?: string
  permissions?: string[]
  items?: NavItem[]
}

const data: { navMain: NavItem[] } = {
  navMain: [
    {
      title: "Tổng quan",
      url: "/admin",
      icon: IconDashboard,
      permission: "admin.access",
    },
    {
      title: "Quản lý người dùng",
      icon: IconUsers,
      items: [
        {
          title: "Người dùng",
          url: "/admin/users",
          icon: IconUser,
          permission: "users.read",
        },
        {
          title: "Hạng thành viên",
          url: "/admin/loyalty",
          icon: IconAward,
          permission: "loyalty-tiers.read",
        },
        {
          title: "Hỗ trợ thành viên",
          url: "/admin/support",
          icon: IconLifebuoy,
          permission: "support.read",
        },
      ],
    },
    {
      title: "Quản lý nội dung",
      icon: IconFileDescription,
      items: [
        {
          title: "Liên kết mạng xã hội",
          url: "/admin/social-links",
          icon: IconLink,
          permission: "links.read",
        },
        {
          title: "Trang nội dung",
          url: "/admin/pages",
          icon: IconFiles,
          permission: "pages.read",
        },
        {
          title: "Thư viện ảnh",
          url: "/admin/media",
          icon: IconPhoto,
          permission: "admin-media.read",
        },
        {
          title: "Menu website",
          url: "/admin/menus",
          icon: IconMenu2,
          permission: "menus.read",
        },
        {
          title: "Thông báo",
          url: "/admin/announcements",
          icon: IconBell,
          permission: "announcements.view",
        },
      ],
    },
    {
      title: "Kiếm tiền & thanh toán",
      icon: IconMoneybag,
      items: [
        {
          title: "Cấp độ kiếm tiền",
          url: "/admin/monetization-levels",
          icon: IconChartBar,
          permission: "monetization-levels.read",
        },
        {
          title: "Phương thức thanh toán",
          url: "/admin/payment-methods",
          icon: IconCreditCardPay,
          permission: "payment-methods.read",
        },
        {
          title: "Yêu cầu rút tiền",
          url: "/admin/withdrawals",
          icon: IconCashBanknote,
          permission: "withdrawals.read",
        },
      ],
    },
    {
      title: "Bảo mật & kiểm tra",
      icon: IconShieldSearch,
      items: [
        {
          title: "Báo cáo liên kết",
          url: "/admin/link-reports",
          icon: IconFlag,
          permission: "link-reports.read",
        },
        {
          title: "Nhật ký truy cập",
          url: "/admin/stu-access-logs",
          icon: IconLogs,
          permission: "stu_access_logs.view",
        },
        {
          title: "Vai trò & quyền hạn",
          url: "/admin/roles",
          icon: IconLockAccess,
          permission: "roles.read",
        },
      ],
    },
    {
      title: "Hệ thống",
      icon: IconSettings,
      items: [
        {
          title: "Ngôn ngữ",
          url: "/admin/languages",
          icon: IconLanguage,
          permission: "languages.read",
        },
        {
          title: "Email",
          url: "/admin/emails",
          icon: IconMail,
          permission: "emails.read",
          permissions: [
            "emails.read",
            "emails.templates.read",
            "emails.logs.read",
            "emails.settings.update",
            "emails.senders.manage",
            "emails.preferences.manage",
          ],
        },
        {
          title: "Cài đặt",
          url: "/admin/settings",
          icon: IconAdjustments,
          permission: "settings.read",
          permissions: ["settings.read", "currencies.read"],
        },
      ],
    },
  ],
}

function hasPermission(
  item: NavItem,
  userPermissions: readonly string[],
): boolean {
  const requiredPermissions = [
    ...(item.permission ? [item.permission] : []),
    ...(item.permissions ?? []),
  ]

  return (
    requiredPermissions.length === 0 ||
    requiredPermissions.some((permission) =>
      userPermissions.includes(permission),
    )
  )
}

export function filterNavByPermissions(
  items: NavItem[],
  userPermissions: readonly string[],
): NavItem[] {
  return items.reduce<NavItem[]>((result, item) => {
    if (item.items?.length) {
      const allowedChildren = filterNavByPermissions(
        item.items,
        userPermissions,
      )

      if (allowedChildren.length > 0) {
        result.push({
          ...item,
          items: allowedChildren,
        })
      }

      return result
    }

    if (hasPermission(item, userPermissions)) {
      result.push(item)
    }

    return result
  }, [])
}

export function AdminSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const currentUser = useAuthUser()
  const permissions = useAdminPermissions()
  const pathname = usePathname()
  const navigation = React.useMemo(
    () => filterNavByPermissions(data.navMain, permissions),
    [permissions],
  )
  const user = {
    name: currentUser.name || "Administrator",
    email: currentUser.email,
    avatar: currentUser.avatar || "",
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/admin">
                <SiteBrandMark className="size-8 border-sidebar-border bg-sidebar-primary text-sidebar-primary-foreground" />
                <div className="flex flex-col gap-0.5 leading-none">
                  <SiteBrandName className="font-medium" />
                  <span className="text-xs text-muted-foreground">Admin Console</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <AdminNavigation items={navigation} pathname={pathname} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}

function AdminNavigation({
  items,
  pathname,
}: {
  items: NavItem[]
  pathname: string
}) {
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const Icon = item.icon

            if (item.items?.length) {
              const isGroupActive = item.items.some((child) =>
                isPathActive(pathname, child.url),
              )

              return (
                <Collapsible
                  key={item.title}
                  asChild
                  defaultOpen={isGroupActive}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={item.title}
                        isActive={isGroupActive}
                      >
                        {Icon ? <Icon /> : null}
                        <span>{item.title}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items.map((child) => {
                          if (!child.url) return null
                          const ChildIcon = child.icon
                          const isActive = isPathActive(pathname, child.url)

                          return (
                            <SidebarMenuSubItem key={child.url}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={isActive}
                              >
                                <Link
                                  href={child.url}
                                  aria-current={isActive ? "page" : undefined}
                                >
                                  {ChildIcon ? <ChildIcon /> : null}
                                  <span>{child.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )
            }

            if (!item.url) return null
            const isActive = isPathActive(pathname, item.url)

            return (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={isActive}
                >
                  <Link
                    href={item.url}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {Icon ? <Icon /> : null}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

function isPathActive(pathname: string, url?: string) {
  if (!url) return false
  return (
    pathname === url ||
    (url !== "/admin" && pathname.startsWith(`${url}/`))
  )
}
