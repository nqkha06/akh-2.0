"use client"

import Link from "next/link"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { ArrowUpRight, LogOut, Moon, Settings, Sun, UsersRound } from "lucide-react"
import { useTheme } from "next-themes"

import { logoutAndRedirect } from "@/features/auth/api/auth.client"
import { useAuthUser } from "@/features/auth/components/auth-user-provider"

export function AdminHeader() {
  const currentUser = useAuthUser()
  const userName = currentUser.name || "Administrator"
  const avatarFallback = userName
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
  const { setTheme } = useTheme()

  return (
    <header className="flex  border-b border-border h-(--header-height) shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex  min-w-0 flex-1 items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1 border border-border" />
      </div>

      <div className="flex items-center gap-2 px-4 lg:px-6">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative bg-transparent hover:bg-muted rounded-full">
              <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>

          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9 rounded-lg p-0"
              aria-label="Menu tài khoản quản trị"
            >
              <Avatar className="size-8 rounded-lg">
                <AvatarImage
                  src={currentUser.avatar || undefined}
                  alt={userName}
                />
                <AvatarFallback className="rounded-lg">{avatarFallback || "AD"}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="w-64 rounded-xl p-1.5 shadow-lg"
          >
            <div className="flex items-center gap-3 px-2 py-2">
              <Avatar className="size-9 rounded-lg">
                <AvatarImage
                  src={currentUser.avatar || undefined}
                  alt={userName}
                />
                <AvatarFallback className="rounded-lg">{avatarFallback || "AD"}</AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {userName}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {currentUser.email}
                </p>
              </div>
            </div>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              asChild
              className="cursor-pointer gap-2 rounded-lg bg-primary/[0.06] text-primary focus:bg-primary/10 focus:text-primary"
            >
              <Link href="/member">
                <UsersRound className="size-4" />
                <span className="flex-1">Khu vực member</span>
                <ArrowUpRight className="size-3.5 opacity-70" />
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild className="cursor-pointer gap-2 rounded-lg">
              <Link href="/member/account">
                <Settings className="size-4 text-muted-foreground" />
                <span>Cài đặt tài khoản</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              variant="destructive"
              className="cursor-pointer gap-2 rounded-lg"
              onSelect={() => void logoutAndRedirect("/login")}
            >
              <LogOut className="size-4" />
              <span>Đăng xuất</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
