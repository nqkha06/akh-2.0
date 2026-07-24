import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AuthScreen } from "@/components/auth/auth-screen";
import { getPublicSiteSettings } from "@/features/site-settings/api/public-settings.server";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSiteSettings();
  return {
    title: `Đăng nhập — ${settings.siteName}`,
    description: `Đăng nhập ${settings.siteName} để quản lý link và theo dõi hiệu suất.`,
  };
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    callbackUrl?: string | string[];
    reason?: string | string[];
    error?: string | string[];
    code?: string | string[];
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
  const authError = Array.isArray(params.error) ? params.error[0] : params.error;
  const authCode = Array.isArray(params.code) ? params.code[0] : params.code;
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
      initialMessage={
        reason === "session-expired"
          ? "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
          : authError === "CredentialsSignin" || authCode === "credentials"
            ? "Email hoặc mật khẩu không chính xác."
            : authError
              ? "Không thể hoàn tất đăng nhập. Vui lòng thử lại."
              : ""
      }
    />
  );
}
