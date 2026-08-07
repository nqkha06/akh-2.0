import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthScreen } from "@/components/auth/auth-screen";
import { getPublicSiteSettings } from "@/features/site-settings/api/public-settings.server";
import { getSignedInRedirect } from "@/lib/auth/redirects";
import { getOptionalServerUser } from "@/lib/auth/server-session";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSiteSettings();
  return {
    title: `Quên mật khẩu — ${settings.siteName}`,
    description: `Nhận hướng dẫn đặt lại mật khẩu ${settings.siteName}.`,
  };
}

export default async function ForgotPasswordPage() {
  const currentUser = await getOptionalServerUser();
  if (currentUser) {
    redirect(getSignedInRedirect(currentUser));
  }
  return <AuthScreen mode="forgot" />;
}
