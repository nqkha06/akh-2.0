import "server-only"

import { redirect } from "next/navigation"

import { auth } from "@/auth"

export interface CurrentBackendUser {
  id: number
  email: string
  name: string
  status: string
  role?: string
  roles?: string[]
  permissions?: string[]
}

const backendApiUrl = (
  process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL
)?.replace(/\/$/, "")

function getLoginUrl(callbackUrl: string, reason?: string) {
  const searchParams = new URLSearchParams({ callbackUrl })

  if (reason) {
    searchParams.set("reason", reason)
  }

  return `/login?${searchParams.toString()}`
}

async function fetchCurrentUser(
  accessToken: string,
): Promise<CurrentBackendUser | null> {
  if (!backendApiUrl) {
    throw new Error(
      "Missing API_INTERNAL_URL or NEXT_PUBLIC_API_URL environment variable.",
    )
  }

  try {
    const response = await fetch(`${backendApiUrl}/auth/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    })

    if (!response.ok) {
      return null
    }

    return (await response.json()) as CurrentBackendUser
  } catch {
    return null
  }
}

export async function requireMember(callbackUrl = "/member") {
  const session = await auth()

  if (!session?.user || !session.backendAccessToken || session.authError) {
    redirect(getLoginUrl(callbackUrl))
  }

  const currentUser = await fetchCurrentUser(session.backendAccessToken)

  if (!currentUser) {
    redirect(getLoginUrl(callbackUrl, "session-expired"))
  }

  return {
    session,
    currentUser,
  }
}

export async function requireAdmin() {
  const context = await requireMember("/admin")

  if (!context.currentUser.permissions?.includes("admin.access")) {
    redirect("/member")
  }

  return context
}
