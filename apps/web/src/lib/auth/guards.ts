import "server-only"

import { redirect } from "next/navigation"
import { cache } from "react"

import { readAuthError } from "@/lib/auth/auth-errors"
import {
  requireFreshServerSession,
  serverApiFetch,
} from "@/lib/auth/server-access"

export interface CurrentBackendUser {
  id: number
  email: string
  name: string
  status: string
  role?: string
  roles?: string[]
  permissions?: string[]
}

type CurrentUserResult =
  | { user: CurrentBackendUser; message?: never }
  | { user: null; message: string }

const fetchCurrentUser = cache(async function fetchCurrentUser(
  callbackUrl: string,
): Promise<CurrentUserResult> {
  const response = await serverApiFetch(
    "/auth/me",
    { cache: "no-store" },
    callbackUrl,
  )
  if (!response.ok) {
    const error = await readAuthError(response)
    return {
      user: null,
      message: error.message,
    }
  }
  return {
    user: (await response.json()) as CurrentBackendUser,
  }
})

export async function requireMember(callbackUrl = "/member") {
  const session = await requireFreshServerSession(callbackUrl)
  const currentUserResult = await fetchCurrentUser(callbackUrl)
  if (!currentUserResult.user) {
    throw new Error(currentUserResult.message)
  }

  return {
    session,
    currentUser: currentUserResult.user,
  }
}

export async function requireAdmin() {
  const context = await requireMember("/admin")

  if (!context.currentUser.permissions?.includes("admin.access")) {
    redirect("/member")
  }

  return context
}
