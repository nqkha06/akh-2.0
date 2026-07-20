import { NextResponse, type NextRequest } from "next/server"

import { unstable_update } from "@/auth"
import { isTerminalAuthError } from "@/lib/auth/auth-errors"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return NextResponse.json(
      { statusCode: 403, message: "Origin không được phép refresh session." },
      { status: 403 },
    )
  }
  const callbackUrl = safeCallbackUrl(
    request.nextUrl.searchParams.get("callbackUrl"),
  )
  const session = await refreshSession()

  if (
    session?.user &&
    session.backendAccessToken &&
    !session.authError
  ) {
    return noStoreRedirect(new URL(callbackUrl, request.url))
  }

  if (session?.authError && !isTerminalAuthError(session.authError)) {
    return NextResponse.json(
      {
        statusCode: 503,
        code: session.authError,
        message: "Dịch vụ xác thực tạm thời không khả dụng.",
        retryable: true,
      },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      },
    )
  }

  const loginUrl = new URL("/login", request.url)
  loginUrl.searchParams.set("callbackUrl", callbackUrl)
  loginUrl.searchParams.set("reason", "session-expired")
  return noStoreRedirect(loginUrl)
}

async function refreshSession() {
  try {
    return await unstable_update({})
  } catch {
    return null
  }
}

function safeCallbackUrl(value: string | null) {
  if (
    value &&
    (value === "/member" ||
      value.startsWith("/member/") ||
      value === "/admin" ||
      value.startsWith("/admin/"))
  ) {
    return value
  }
  return "/member"
}

function noStoreRedirect(url: URL) {
  const response = NextResponse.redirect(url)
  response.headers.set("Cache-Control", "no-store")
  return response
}
