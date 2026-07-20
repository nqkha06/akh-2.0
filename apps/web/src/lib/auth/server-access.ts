import "server-only"

import type { Session } from "next-auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import {
  AUTH_ERROR_CODES,
  isTerminalAuthError,
  readAuthError,
} from "@/lib/auth/auth-errors"
import { getServerSession } from "@/lib/auth/server-session"

const backendApiUrl = process.env.API_INTERNAL_URL?.replace(/\/$/, "")
const ACCESS_TOKEN_REFRESH_SKEW_MS = 5_000

function safeCallbackUrl(value: string) {
  return value.startsWith("/") && !value.startsWith("//") ? value : "/member"
}

export function loginUrl(callbackUrl: string, reason?: string) {
  const searchParams = new URLSearchParams({
    callbackUrl: safeCallbackUrl(callbackUrl),
  })
  if (reason) searchParams.set("reason", reason)
  return `/login?${searchParams.toString()}`
}

export function refreshSessionUrl(callbackUrl: string) {
  const searchParams = new URLSearchParams({
    callbackUrl: safeCallbackUrl(callbackUrl),
  })
  return `/api/auth/refresh-session?${searchParams.toString()}`
}

export function accessTokenNeedsRefresh(
  session: Pick<Session, "backendAccessTokenExpiresAt">,
) {
  const expiresAt = Number(session.backendAccessTokenExpiresAt || 0)
  return !expiresAt || Date.now() >= expiresAt - ACCESS_TOKEN_REFRESH_SKEW_MS
}

export async function requireFreshServerSession(
  callbackUrl = "/member",
): Promise<Session> {
  const resolvedCallbackUrl = await currentProtectedUrl(callbackUrl)
  const session = await getServerSession()
  if (!session?.user) redirect(loginUrl(resolvedCallbackUrl))
  if (isTerminalAuthError(session.authError)) {
    redirect(loginUrl(resolvedCallbackUrl, "session-expired"))
  }
  if (!session.backendAccessToken) redirect(loginUrl(resolvedCallbackUrl))
  if (session.authError) {
    throw new Error(
      `Dịch vụ xác thực tạm thời không khả dụng (${session.authError}).`,
    )
  }
  if (accessTokenNeedsRefresh(session)) {
    redirect(refreshSessionUrl(resolvedCallbackUrl))
  }
  return session
}

export async function serverApiFetch(
  path: string,
  init: RequestInit = {},
  callbackUrl = "/member",
) {
  if (!backendApiUrl) {
    throw new Error("Missing API_INTERNAL_URL environment variable.")
  }
  const session = await requireFreshServerSession(callbackUrl)
  const resolvedCallbackUrl = await currentProtectedUrl(callbackUrl)
  const headers = new Headers(init.headers)
  headers.set("Authorization", `Bearer ${session.backendAccessToken}`)
  const response = await fetch(
    `${backendApiUrl}${path.startsWith("/") ? path : `/${path}`}`,
    {
      ...init,
      headers,
      cache: init.cache ?? "no-store",
    },
  )

  if (response.status === 401) {
    const error = await readAuthError(response)
    if (error.code === AUTH_ERROR_CODES.ACCESS_TOKEN_EXPIRED) {
      redirect(refreshSessionUrl(resolvedCallbackUrl))
    }
    if (isTerminalAuthError(error.code)) {
      redirect(loginUrl(resolvedCallbackUrl, "session-expired"))
    }
  }
  return response
}

async function currentProtectedUrl(fallback: string) {
  const value = (await headers()).get("x-stu-protected-url")
  return value ? safeCallbackUrl(value) : safeCallbackUrl(fallback)
}
