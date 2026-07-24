import type { Session } from "next-auth"
import { revalidatePath, revalidateTag } from "next/cache"
import { NextResponse, type NextRequest } from "next/server"

import { auth, unstable_update } from "@/auth"
import {
  AUTH_ERROR_CODES,
  isTerminalAuthError,
  readAuthError,
} from "@/lib/auth/auth-errors"
import { accessTokenNeedsRefresh } from "@/lib/auth/server-access"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const backendApiUrl = process.env.API_INTERNAL_URL?.replace(/\/$/, "")
if (!backendApiUrl) {
  throw new Error("Missing API_INTERNAL_URL environment variable.")
}

const blockedAuthPaths = new Set([
  "auth/login",
  "auth/google",
  "auth/refresh",
  "auth/logout",
])

type RouteContext = {
  params: Promise<{ path?: string[] }>
}

async function handler(request: NextRequest, context: RouteContext) {
  if (!isTrustedBrowserRequest(request)) {
    return NextResponse.json(
      {
        statusCode: 403,
        code: "UNTRUSTED_ORIGIN",
        message: "Origin không được phép gọi API.",
      },
      { status: 403 },
    )
  }

  const session = await auth()
  if (!session?.user) {
    return authErrorResponse(
      401,
      AUTH_ERROR_CODES.SESSION_NOT_FOUND,
      "Bạn cần đăng nhập để thực hiện thao tác này.",
    )
  }
  if (session.authError && isTerminalAuthError(session.authError)) {
    return sessionErrorResponse(session)
  }

  const { path = [] } = await context.params
  if (path.length === 0) {
    return authErrorResponse(
      404,
      AUTH_ERROR_CODES.SESSION_NOT_FOUND,
      "API path không hợp lệ.",
    )
  }

  const relativePath = path.map(encodeURIComponent).join("/")
  if (blockedAuthPaths.has(relativePath)) {
    return NextResponse.json(
      {
        statusCode: 404,
        message: "Endpoint không khả dụng qua public BFF.",
      },
      { status: 404 },
    )
  }

  const requestBody = await readRequestBody(request)
  let activeSession = session
  let refreshAttempted = false

  if (
    !activeSession.backendAccessToken ||
    accessTokenNeedsRefresh(activeSession)
  ) {
    refreshAttempted = true
    const refreshedSession = await refreshServerSession()
    if (!refreshedSession?.backendAccessToken || refreshedSession.authError) {
      return refreshedSession?.authError
        ? sessionErrorResponse(refreshedSession)
        : authErrorResponse(
            503,
            AUTH_ERROR_CODES.AUTH_SERVICE_UNAVAILABLE,
            "Dịch vụ xác thực tạm thời không khả dụng.",
            true,
          )
    }
    activeSession = refreshedSession
  }

  const firstResponse = await safelyCallBackend(
    request,
    relativePath,
    requestBody,
    activeSession.backendAccessToken,
  )
  if (!firstResponse) {
    return authErrorResponse(
      503,
      AUTH_ERROR_CODES.AUTH_SERVICE_UNAVAILABLE,
      "Dịch vụ API tạm thời không khả dụng.",
      true,
    )
  }

  if (firstResponse.status !== 401) {
    invalidateSiteSettings(request, relativePath, firstResponse)
    return forwardBackendResponse(firstResponse, request.method)
  }

  const firstError = await readAuthError(firstResponse)
  if (
    firstError.code === AUTH_ERROR_CODES.ACCESS_TOKEN_EXPIRED &&
    !refreshAttempted
  ) {
    const refreshedSession = await refreshServerSession()
    if (refreshedSession?.backendAccessToken && !refreshedSession.authError) {
      const retriedResponse = await safelyCallBackend(
        request,
        relativePath,
        requestBody,
        refreshedSession.backendAccessToken,
      )
      if (!retriedResponse) {
        return authErrorResponse(
          503,
          AUTH_ERROR_CODES.AUTH_SERVICE_UNAVAILABLE,
          "Dịch vụ API tạm thời không khả dụng.",
          true,
        )
      }
      invalidateSiteSettings(request, relativePath, retriedResponse)
      return forwardBackendResponse(retriedResponse, request.method)
    }

    if (refreshedSession?.authError) {
      return sessionErrorResponse(refreshedSession)
    }
  }

  return forwardBackendResponse(firstResponse, request.method)
}

function invalidateSiteSettings(
  request: NextRequest,
  relativePath: string,
  response: Response,
) {
  if (
    request.method === "PATCH" &&
    relativePath === "admin/settings/appearance" &&
    response.ok
  ) {
    revalidateTag("public-site-settings", "max")
    revalidatePath("/", "layout")
  }
  if (
    request.method !== "GET" &&
    request.method !== "HEAD" &&
    relativePath.startsWith("admin/menus") &&
    response.ok
  ) {
    revalidateTag("public-website-menus", "max")
    revalidatePath("/", "page")
  }
}

export {
  handler as DELETE,
  handler as GET,
  handler as HEAD,
  handler as PATCH,
  handler as POST,
  handler as PUT,
}

async function refreshServerSession() {
  try {
    return await unstable_update({})
  } catch {
    return null
  }
}

async function readRequestBody(request: Request) {
  if (request.method === "GET" || request.method === "HEAD" || !request.body) {
    return undefined
  }
  return request.arrayBuffer()
}

function isTrustedBrowserRequest(request: NextRequest) {
  if (request.method === "GET" || request.method === "HEAD") {
    return true
  }

  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return false
  }

  const origin = request.headers.get("origin")
  return !origin || origin === request.nextUrl.origin
}

async function safelyCallBackend(
  request: NextRequest,
  relativePath: string,
  body: ArrayBuffer | undefined,
  accessToken?: string,
) {
  try {
    return await callBackend(request, relativePath, body, accessToken)
  } catch {
    return null
  }
}

async function callBackend(
  request: NextRequest,
  relativePath: string,
  body: ArrayBuffer | undefined,
  accessToken?: string,
) {
  const headers = new Headers()
  copyRequestHeader(request.headers, headers, "accept")
  copyRequestHeader(request.headers, headers, "content-type")
  copyRequestHeader(request.headers, headers, "if-modified-since")
  copyRequestHeader(request.headers, headers, "if-none-match")
  copyRequestHeader(request.headers, headers, "range")
  copyRequestHeader(request.headers, headers, "user-agent")

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`)
  }

  return fetch(
    `${backendApiUrl}/${relativePath}${request.nextUrl.search}`,
    {
      method: request.method,
      headers,
      body,
      cache: "no-store",
      redirect: "manual",
      signal: request.signal,
    },
  )
}

function copyRequestHeader(
  source: Headers,
  target: Headers,
  name: string,
) {
  const value = source.get(name)
  if (value) target.set(name, value)
}

function forwardBackendResponse(response: Response, requestMethod: string) {
  const headers = new Headers()
  for (const name of [
    "accept-ranges",
    "cache-control",
    "content-disposition",
    "content-length",
    "content-range",
    "content-type",
    "etag",
    "last-modified",
    "location",
  ]) {
    const value = response.headers.get(name)
    if (value) headers.set(name, value)
  }

  if (!headers.has("cache-control")) {
    headers.set("Cache-Control", "no-store")
  }

  const hasNoBody =
    requestMethod === "HEAD" ||
    response.status === 204 ||
    response.status === 304

  return new Response(hasNoBody ? null : response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

function sessionErrorResponse(session: Pick<Session, "authError">) {
  const code =
    session.authError || AUTH_ERROR_CODES.AUTH_SERVICE_UNAVAILABLE
  const terminal = isTerminalAuthError(code)
  const status = terminal ? 401 : 503

  return authErrorResponse(
    status,
    code,
    terminal
      ? "Phiên đăng nhập không còn hợp lệ."
      : "Dịch vụ xác thực tạm thời không khả dụng.",
    !terminal,
  )
}

function authErrorResponse(
  statusCode: number,
  code: string,
  message: string,
  retryable = false,
) {
  return NextResponse.json(
    { statusCode, code, message, retryable },
    { status: statusCode },
  )
}
