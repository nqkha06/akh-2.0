import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

import {
  AUTH_ERROR_CODES,
  readAuthError,
} from "@/lib/auth/auth-errors";
import {
  BackendRefreshError,
  getSetCookieHeaders,
  refreshBackendSession,
} from "@/lib/auth/refresh-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const backendApiUrl = process.env.API_INTERNAL_URL?.replace(/\/$/, "");
if (!backendApiUrl) {
  throw new Error("Missing API_INTERNAL_URL environment variable.");
}

const authPathsWithoutAutomaticRefresh = new Set([
  "auth/login",
  "auth/register",
  "auth/google",
  "auth/refresh",
  "auth/logout",
]);

type RouteContext = {
  params: Promise<{ path?: string[] }>;
};

async function handler(request: NextRequest, context: RouteContext) {
  if (!isTrustedBrowserRequest(request)) {
    return NextResponse.json(
      {
        statusCode: 403,
        code: "UNTRUSTED_ORIGIN",
        message: "Origin không được phép gọi API.",
      },
      { status: 403 },
    );
  }

  const { path = [] } = await context.params;
  if (!path.length) {
    return NextResponse.json(
      { statusCode: 404, message: "API path không hợp lệ." },
      { status: 404 },
    );
  }

  const relativePath = path.map(encodeURIComponent).join("/");
  const requestBody = await readRequestBody(request);
  const firstResponse = await safelyCallBackend(
    request,
    relativePath,
    requestBody,
  );
  if (!firstResponse) return unavailableResponse();

  if (
    firstResponse.status === 401 &&
    !authPathsWithoutAutomaticRefresh.has(relativePath) &&
    request.headers.get("cookie")
  ) {
    const error = await readAuthError(firstResponse);
    if (
      error.code === AUTH_ERROR_CODES.ACCESS_TOKEN_EXPIRED ||
      error.code === AUTH_ERROR_CODES.ACCESS_TOKEN_INVALID
    ) {
      try {
        const refreshed = await refreshBackendSession(
          request.headers.get("cookie") || "",
          request.headers.get("origin") || undefined,
        );
        const retriedResponse = await safelyCallBackend(
          request,
          relativePath,
          requestBody,
          refreshed.accessToken,
        );
        if (!retriedResponse) return unavailableResponse();
        invalidateContent(request, relativePath, retriedResponse);
        return forwardBackendResponse(
          retriedResponse,
          request.method,
          refreshed.setCookies,
        );
      } catch (refreshError) {
        if (refreshError instanceof BackendRefreshError) {
          return NextResponse.json(
            {
              statusCode: refreshError.status,
              code: refreshError.code,
              message: refreshError.message,
              retryable: refreshError.status >= 500,
            },
            { status: refreshError.status },
          );
        }
        return unavailableResponse();
      }
    }
  }

  invalidateContent(request, relativePath, firstResponse);
  return forwardBackendResponse(firstResponse, request.method);
}

export {
  handler as DELETE,
  handler as GET,
  handler as HEAD,
  handler as PATCH,
  handler as POST,
  handler as PUT,
};

async function readRequestBody(request: Request) {
  if (request.method === "GET" || request.method === "HEAD" || !request.body) {
    return undefined;
  }
  return request.arrayBuffer();
}

function isTrustedBrowserRequest(request: NextRequest) {
  if (request.method === "GET" || request.method === "HEAD") return true;
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = request.headers.get("origin");
  return !origin || origin === request.nextUrl.origin;
}

async function safelyCallBackend(
  request: NextRequest,
  relativePath: string,
  body: ArrayBuffer | undefined,
  accessToken?: string,
) {
  try {
    const headers = new Headers();
    for (const name of [
      "accept",
      "content-type",
      "cookie",
      "if-modified-since",
      "if-none-match",
      "origin",
      "range",
      "user-agent",
    ]) {
      const value = request.headers.get(name);
      if (value) headers.set(name, value);
    }
    if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

    return await fetch(
      `${backendApiUrl}/${relativePath}${request.nextUrl.search}`,
      {
        method: request.method,
        headers,
        body,
        cache: "no-store",
        redirect: "manual",
        signal: request.signal,
      },
    );
  } catch {
    return null;
  }
}

function forwardBackendResponse(
  response: Response,
  requestMethod: string,
  additionalCookies: string[] = [],
) {
  const headers = new Headers();
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
    const value = response.headers.get(name);
    if (value) headers.set(name, value);
  }
  for (const cookie of [
    ...additionalCookies,
    ...getSetCookieHeaders(response.headers),
  ]) {
    headers.append("Set-Cookie", cookie);
  }
  if (!headers.has("cache-control")) headers.set("Cache-Control", "no-store");

  const hasNoBody =
    requestMethod === "HEAD" ||
    response.status === 204 ||
    response.status === 304;
  return new Response(hasNoBody ? null : response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function invalidateContent(
  request: NextRequest,
  relativePath: string,
  response: Response,
) {
  if (
    request.method === "PATCH" &&
    relativePath === "admin/settings/appearance" &&
    response.ok
  ) {
    revalidateTag("public-site-settings", "max");
    revalidatePath("/", "layout");
  }
  if (
    request.method !== "GET" &&
    request.method !== "HEAD" &&
    relativePath.startsWith("admin/menus") &&
    response.ok
  ) {
    revalidateTag("public-website-menus", "max");
    revalidatePath("/", "page");
  }
}

function unavailableResponse() {
  return NextResponse.json(
    {
      statusCode: 503,
      code: AUTH_ERROR_CODES.AUTH_SERVICE_UNAVAILABLE,
      message: "Dịch vụ API tạm thời không khả dụng.",
      retryable: true,
    },
    { status: 503 },
  );
}
