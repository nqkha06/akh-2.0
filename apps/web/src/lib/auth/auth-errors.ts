export const AUTH_ERROR_CODES = {
  ACCESS_TOKEN_EXPIRED: "ACCESS_TOKEN_EXPIRED",
  ACCESS_TOKEN_INVALID: "ACCESS_TOKEN_INVALID",
  REFRESH_TOKEN_EXPIRED: "REFRESH_TOKEN_EXPIRED",
  REFRESH_TOKEN_INVALID: "REFRESH_TOKEN_INVALID",
  REFRESH_TOKEN_REUSE_DETECTED: "REFRESH_TOKEN_REUSE_DETECTED",
  SESSION_REVOKED: "SESSION_REVOKED",
  SESSION_NOT_FOUND: "SESSION_NOT_FOUND",
  USER_DISABLED: "USER_DISABLED",
  NETWORK_ERROR: "NETWORK_ERROR",
  TIMEOUT: "TIMEOUT",
  AUTH_SERVICE_UNAVAILABLE: "AUTH_SERVICE_UNAVAILABLE",
} as const

export type AuthErrorCode =
  (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES]

const TERMINAL_AUTH_ERRORS = new Set<AuthErrorCode>([
  AUTH_ERROR_CODES.SESSION_REVOKED,
  AUTH_ERROR_CODES.SESSION_NOT_FOUND,
  AUTH_ERROR_CODES.REFRESH_TOKEN_EXPIRED,
  AUTH_ERROR_CODES.REFRESH_TOKEN_REUSE_DETECTED,
  AUTH_ERROR_CODES.USER_DISABLED,
])

export type AuthErrorBody = {
  statusCode?: number
  code?: string
  message?: string | string[]
  retryable?: boolean
}

export function isAuthErrorCode(value: unknown): value is AuthErrorCode {
  return (
    typeof value === "string" &&
    Object.values(AUTH_ERROR_CODES).includes(value as AuthErrorCode)
  )
}

export function isTerminalAuthError(
  code: string | undefined,
): code is AuthErrorCode {
  return isAuthErrorCode(code) && TERMINAL_AUTH_ERRORS.has(code)
}

export async function readAuthError(response: Response) {
  try {
    const body = (await response.clone().json()) as AuthErrorBody
    const code = isAuthErrorCode(body.code)
      ? body.code
      : response.status >= 500
        ? AUTH_ERROR_CODES.AUTH_SERVICE_UNAVAILABLE
        : undefined
    const message = Array.isArray(body.message)
      ? body.message.join(", ")
      : body.message

    return {
      status: response.status,
      code,
      message: message || `Request failed with ${response.status}`,
      retryable: body.retryable === true || response.status >= 500,
    }
  } catch {
    return {
      status: response.status,
      code:
        response.status >= 500
          ? AUTH_ERROR_CODES.AUTH_SERVICE_UNAVAILABLE
          : undefined,
      message: `Request failed with ${response.status}`,
      retryable: response.status >= 500,
    }
  }
}
