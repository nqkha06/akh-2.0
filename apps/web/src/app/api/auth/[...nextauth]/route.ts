import { handlers } from "@/auth";
import { NextResponse, type NextRequest } from "next/server";

import { REFERRAL_COOKIE_NAME } from "@/lib/auth/referral-cookie";

export async function GET(request: NextRequest) {
  const response = await handlers.GET(request);
  if (!request.nextUrl.pathname.endsWith("/callback/google")) {
    return response;
  }

  const clearedResponse = new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
  clearedResponse.cookies.delete(REFERRAL_COOKIE_NAME);
  return clearedResponse;
}

export const POST = handlers.POST;
