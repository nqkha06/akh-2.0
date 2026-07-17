import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AuthScreen } from "@/components/auth/auth-screen";

export const metadata: Metadata = {
  title: "Đăng nhập — Linkicom",
  description: "Đăng nhập Linkicom để quản lý link và theo dõi hiệu suất.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    callbackUrl?: string | string[];
    reason?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const callbackCandidate = Array.isArray(params.callbackUrl)
    ? params.callbackUrl[0]
    : params.callbackUrl;
  const callbackUrl =
    callbackCandidate?.startsWith("/") && !callbackCandidate.startsWith("//")
      ? callbackCandidate
      : "/member";
  const reason = Array.isArray(params.reason) ? params.reason[0] : params.reason;
  const session = await auth();
  if (
    reason !== "session-expired" &&
    session?.user &&
    session.backendAccessToken &&
    !session.authError
  ) {
    redirect(callbackUrl);
  }

  const googleEnabled = Boolean(
    process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
  );

  return (
    <AuthScreen
      mode="login"
      googleEnabled={googleEnabled}
      redirectTo={callbackUrl}
    />
  );
}
