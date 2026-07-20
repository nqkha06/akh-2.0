import { NextResponse, type NextRequest } from "next/server";

import { REFERRAL_COOKIE_NAME } from "@/lib/auth/referral-cookie";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    referralCode?: unknown;
  } | null;
  const referralCode =
    typeof body?.referralCode === "string"
      ? body.referralCode.trim().toLowerCase()
      : "";
  if (!/^[a-z0-9_-]{8,32}$/.test(referralCode)) {
    return NextResponse.json(
      { message: "Mã giới thiệu không hợp lệ." },
      { status: 400 },
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(REFERRAL_COOKIE_NAME, referralCode, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });
  return response;
}
