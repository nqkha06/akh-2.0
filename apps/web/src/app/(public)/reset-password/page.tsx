import type { Metadata } from "next";

import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";
import { getPublicSiteSettings } from "@/features/site-settings/api/public-settings.server";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSiteSettings();
  return {
    title: `Đặt lại mật khẩu — ${settings.siteName}`,
    description: `Tạo mật khẩu mới cho tài khoản ${settings.siteName}.`,
    robots: { index: false, follow: false },
  };
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const params = await searchParams;
  const token = Array.isArray(params.token) ? params.token[0] || "" : params.token || "";
  return <ResetPasswordForm token={token} />;
}
