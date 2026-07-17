import "server-only"

import { createHash } from "node:crypto"

import {
  AUTH_ERROR_CODES,
  type AuthErrorCode,
  readAuthError,
} from "@/lib/auth/auth-errors"

const backendApiUrl = process.env.API_INTERNAL_URL?.replace(/\/$/, "")
if (!backendApiUrl) {
  throw new Error("Missing API_INTERNAL_URL environment variable.")
}
const refreshCookieName =
  process.env.AUTH_REFRESH_COOKIE_NAME || "stu_refresh_token"

export type BackendUser = {
  id: number
  name: string
  email: string
  emailVerifiedAt: string | null
  avatar: string | null
  status: string
  role: string
  roles: string[]
  permissions: string[]
}

export type BackendAuthResponse = {
  accessToken: string
  tokenType: "Bearer"
  expiresIn: string
  accessTokenExpiresAt: number
  user: BackendUser
}

export type BackendAuthResult = BackendAuthResponse & {
  refreshToken: string
}

export class BackendRefreshError extends Error {
  constructor(
    readonly code: AuthErrorCode,
    readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = "BackendRefreshError"
  }
}

const refreshRequests = new Map<string, Promise<BackendAuthResult>>()

export function extractRefreshToken(setCookie: string | null) {
  if (!setCookie) return null
  const match = new RegExp(
    `(?:^|,\\s*)${refreshCookieName}=([^;]+)`,
  ).exec(setCookie)
  return match ? decodeURIComponent(match[1]) : null
}

export function refreshBackendSession(refreshToken: string) {
  const requestKey = createHash("sha256").update(refreshToken).digest("hex")
  const inFlight = refreshRequests.get(requestKey)
  if (inFlight) return inFlight

  const request = executeRefresh(refreshToken)
  refreshRequests.set(requestKey, request)

  const clearRequest = () => {
    if (refreshRequests.get(requestKey) === request) {
      refreshRequests.delete(requestKey)
    }
  }
  void request.then(clearRequest, clearRequest)

  return request
}

async function executeRefresh(refreshToken: string) {
  try {
    const response = await fetch(`${backendApiUrl}/auth/refresh`, {
      method: "POST",
      headers: {
        Cookie: `${refreshCookieName}=${encodeURIComponent(refreshToken)}`,
      },
      credentials: "include",
      cache: "no-store",
    })

    if (!response.ok) {
      const error = await readAuthError(response)
      throw new BackendRefreshError(
        error.code || AUTH_ERROR_CODES.AUTH_SERVICE_UNAVAILABLE,
        error.status,
        error.message,
      )
    }

    const rotatedRefreshToken = extractRefreshToken(
      response.headers.get("set-cookie"),
    )
    if (!rotatedRefreshToken) {
      throw new BackendRefreshError(
        AUTH_ERROR_CODES.AUTH_SERVICE_UNAVAILABLE,
        502,
        "Backend refresh response không có refresh-token cookie.",
      )
    }

    return {
      ...((await response.json()) as BackendAuthResponse),
      refreshToken: rotatedRefreshToken,
    } satisfies BackendAuthResult
  } catch (error) {
    if (error instanceof BackendRefreshError) throw error
    throw new BackendRefreshError(
      AUTH_ERROR_CODES.NETWORK_ERROR,
      503,
      error instanceof Error ? error.message : "Không thể kết nối auth backend.",
    )
  }
}
