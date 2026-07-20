"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
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
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { useAdminPermissions } from "@/features/admin-authorization/components/admin-authorization-provider"
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
import { ChevronsUpDown, Lock } from "lucide-react"

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
      title: "Monetization Levels",
      url: "/admin/monetization-levels",
      icon: IconMoneybag,
      permission: "monetization-levels.read",
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
      title: "Languages",
      url: "/admin/languages",
      icon: IconLanguage,
      permission: "languages.read",
    },
    {
      title: "Website Settings",
      url: "/admin/settings/appearance",
      icon: IconSettings,
      permission: "settings.read",
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
  const { data: session } = useSession()
  const permissions = useAdminPermissions()
  const user = {
    name: session?.user?.name || "Administrator",
    email: session?.user?.email || "admin@linkicom.local",
    avatar: session?.user?.image || "",
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
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Lock className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-medium">Link4Sub</span>
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
          items={data.navMain.filter((item) =>
            permissions.includes(item.permission),
          )}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
