import type { Metadata } from "next"

import { MemberShell } from "@/components/member/member-shell"
import { TooltipProvider } from "@/components/ui/tooltip"
import { requireMember } from "@/lib/auth/guards"

export const metadata: Metadata = {
  title: "Member — Linkicom",
  description: "Quản lý liên kết và tài khoản Linkicom.",
}

export default async function MemberLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  await requireMember("/member")

  return (
    <TooltipProvider delayDuration={300}>
      <MemberShell>{children}</MemberShell>
    </TooltipProvider>
  )
}
