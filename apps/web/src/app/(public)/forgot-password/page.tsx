import type { Metadata } from "next";

import { AuthScreen } from "@/components/auth/auth-screen";
import { getPublicSiteSettings } from "@/features/site-settings/api/public-settings.server";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSiteSettings();
  return {
    title: `Quên mật khẩu — ${settings.siteName}`,
    description: `Nhận hướng dẫn đặt lại mật khẩu ${settings.siteName}.`,
  };
}

export default function ForgotPasswordPage() {
  return <AuthScreen mode="forgot" />;
}
