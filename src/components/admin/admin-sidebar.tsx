"use client"

import * as React from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import {
  IconDashboard,
  IconInnerShadowTop,
  IconLink,
  IconLockAccess,
  IconUsers,
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
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link href="/admin">
                <IconInnerShadowTop className="size-5!" />
                <span className="text-base font-semibold">Linkicom Admin</span>
              </Link>
            </SidebarMenuButton>
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
