"use client"

import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"

type AdminHeaderProps = {
  title?: string
  userName?: string
  avatarUrl?: string
}

export function AdminHeader({
  title = "Dashboard",
  userName = "User",
  avatarUrl,
}: AdminHeaderProps) {
  const avatarFallback = userName
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex min-w-0 flex-1 items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1 border border-border" />

        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />

        <h1 className="truncate text-base font-medium">{title}</h1>
      </div>

      <div className="shrink-0 pr-4 lg:pr-6">
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-9 rounded-lg p-0"
                  aria-label="Mở menu người dùng"
                >
                  <Avatar className="size-8">
                    {avatarUrl && (
                      <AvatarImage src={avatarUrl} alt={userName} />
                    )}
                    <AvatarFallback>{avatarFallback || "U"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>

            <TooltipContent side="bottom" sideOffset={7}>
              Menu người dùng
            </TooltipContent>
          </Tooltip>

          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>Thông tin cá nhân</DropdownMenuItem>
            <DropdownMenuItem>Đăng xuất</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
