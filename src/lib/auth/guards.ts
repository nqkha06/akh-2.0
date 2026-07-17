import "server-only"

import { redirect } from "next/navigation"
import { cache } from "react"

import {
  AUTH_ERROR_CODES,
  isTerminalAuthError,
  readAuthError,
  type AuthErrorCode,
} from "@/lib/auth/auth-errors"
import { getServerSession } from "@/lib/auth/server-session"

export interface CurrentBackendUser {
  id: number
  email: string
  name: string
  status: string
  role?: string
  roles?: string[]
  permissions?: string[]
}

const backendApiUrl = process.env.API_INTERNAL_URL?.replace(/\/$/, "")

function getLoginUrl(callbackUrl: string, reason?: string) {
  const searchParams = new URLSearchParams({ callbackUrl })

  if (reason) {
    searchParams.set("reason", reason)
  }

  return `/login?${searchParams.toString()}`
}

type CurrentUserResult =
  | { user: CurrentBackendUser; errorCode?: never; message?: never }
  | { user: null; errorCode?: AuthErrorCode; message: string }

const fetchCurrentUser = cache(async function fetchCurrentUser(
  accessToken: string,
): Promise<CurrentUserResult> {
  if (!backendApiUrl) {
    throw new Error(
      "Missing API_INTERNAL_URL environment variable.",
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
      const error = await readAuthError(response)
      return {
        user: null,
        errorCode: error.code,
        message: error.message,
      }
    }

    return {
      user: (await response.json()) as CurrentBackendUser,
    }
  } catch {
    return {
      user: null,
      errorCode: AUTH_ERROR_CODES.NETWORK_ERROR,
      message: "Không thể kết nối dịch vụ xác thực.",
    }
  }
})

export async function requireMember(callbackUrl = "/member") {
  const session = await getServerSession()

  if (!session?.user) {
    redirect(getLoginUrl(callbackUrl))
  }
  if (isTerminalAuthError(session.authError)) {
    redirect(getLoginUrl(callbackUrl, "session-expired"))
  }
  if (!session.backendAccessToken) {
    redirect(getLoginUrl(callbackUrl))
  }
  if (session.authError) {
    throw new Error(
      `Dịch vụ xác thực tạm thời không khả dụng (${session.authError}).`,
    )
  }

  const currentUserResult = await fetchCurrentUser(session.backendAccessToken)

  if (
    !currentUserResult.user &&
    isTerminalAuthError(currentUserResult.errorCode)
  ) {
    redirect(getLoginUrl(callbackUrl, "session-expired"))
  }
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
