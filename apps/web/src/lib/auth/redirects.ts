import type { AuthUser } from "@/features/auth/types"

export function getDashboardHref(
  user: Pick<AuthUser, "permissions">,
): "/admin" | "/member" {
  return user.permissions.includes("admin.access") ? "/admin" : "/member"
}

export function getSignedInRedirect(
  user: Pick<AuthUser, "permissions">,
  callbackUrl?: string,
) {
  const fallback = getDashboardHref(user)
  if (!isSafeInternalPath(callbackUrl)) return fallback

  const pathname = callbackUrl.split(/[?#]/, 1)[0]
  if (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password"
  ) {
    return fallback
  }
  if (pathname?.startsWith("/admin") && fallback !== "/admin") {
    return fallback
  }
  return callbackUrl
}

function isSafeInternalPath(value?: string): value is string {
  return Boolean(value?.startsWith("/") && !value.startsWith("//"))
}
