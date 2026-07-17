import { NextResponse } from "next/server";

import { unstable_update } from "@/auth";

export async function POST() {
  const session = await unstable_update({});
  if (!session?.backendAccessToken || session.authError) {
    return NextResponse.json({ message: "Phiên đăng nhập đã hết hạn." }, { status: 401 });
  }
  return NextResponse.json(session);
}
