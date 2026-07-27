"use client"

import * as React from "react"
import {
  IconDashboard,
  IconLink,
  IconLockAccess,
  IconLanguage,
  IconMoneybag,
  IconCreditCardPay,
  IconCashBanknote,
  IconFileDescription,
  IconUsers,
  IconSettings,
  IconPhoto,
  IconMenu2,
  IconLifebuoy,
  IconAward,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { useAdminPermissions } from "@/features/admin-authorization/components/admin-authorization-provider"
import { useAuthUser } from "@/features/auth/components/auth-user-provider"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "../ui/dropdown-menu"
import { ChevronsUpDown } from "lucide-react"
import { SiteBrandMark, SiteBrandName } from "@/components/site-brand"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/admin",
      icon: IconDashboard,
      permission: "admin.access",
    },
    {
      title: "Users",
      url: "/admin/users",
      icon: IconUsers,
      permission: "users.read",
    },
    {
      title: "Social Links",
      url: "/admin/social-links",
      icon: IconLink,
      permission: "links.read",
    },
    {
      title: "Pages",
      url: "/admin/pages",
      icon: IconFileDescription,
      permission: "pages.read",
    },
    {
      title: "Admin Media",
      url: "/admin/media",
      icon: IconPhoto,
      permission: "admin-media.read",
    },
    {
      title: "Website Menus",
      url: "/admin/menus",
      icon: IconMenu2,
      permission: "menus.read",
    },
    {
      title: "Monetization Levels",
      url: "/admin/monetization-levels",
      icon: IconMoneybag,
      permission: "monetization-levels.read",
    },
    {
      title: "Loyalty Tiers",
      url: "/admin/loyalty",
      icon: IconAward,
      permission: "loyalty-tiers.read",
    },
    {
      title: "Payment Methods",
      url: "/admin/payment-methods",
      icon: IconCreditCardPay,
      permission: "payment-methods.read",
    },
    {
      title: "Withdrawals",
      url: "/admin/withdrawals",
      icon: IconCashBanknote,
      permission: "withdrawals.read",
    },
    {
      title: "Member Support",
      url: "/admin/support",
      icon: IconLifebuoy,
      permission: "support.read",
    },
    {
      title: "Languages",
      url: "/admin/languages",
      icon: IconLanguage,
      permission: "languages.read",
    },
    {
      title: "Settings",
      url: "/admin/settings",
      icon: IconSettings,
      permissions: ["settings.read", "currencies.read"],
    },
    {
      title: "Roles & Permissions",
      url: "/admin/roles",
      icon: IconLockAccess,
      permission: "roles.read",
    },
  ],
}

export function AdminSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const currentUser = useAuthUser()
  const permissions = useAdminPermissions()
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <SiteBrandMark className="size-8 border-sidebar-border bg-sidebar-primary text-sidebar-primary-foreground" />
              <div className="flex flex-col gap-0.5 leading-none">
                <SiteBrandName className="font-medium" />
                <span className="">v1</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width)"
            align="start"
          >
            {/* {versions.map((version) => (
              <DropdownMenuItem
                key={version}
                onSelect={() => setSelectedVersion(version)}
              >
                v{version}{" "}
                {version === selectedVersion && <Check className="ml-auto" />}
              </DropdownMenuItem>
            ))} */}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          items={data.navMain.filter((item) => {
            const required =
              "permissions" in item && item.permissions
                ? item.permissions
                : "permission" in item && item.permission
                  ? [item.permission]
                  : []
            return required.some((permission) =>
              permissions.includes(permission),
            )
          })}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
