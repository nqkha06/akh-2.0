import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthScreen } from "@/components/auth/auth-screen";
import { getPublicSiteSettings } from "@/features/site-settings/api/public-settings.server";
import { getOptionalServerUser } from "@/lib/auth/server-session";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSiteSettings();
  return {
    title: `Tạo tài khoản — ${settings.siteName}`,
    description: `Tạo tài khoản ${settings.siteName} miễn phí.`,
  };
}

type SearchParams = Record<string, string | string[] | undefined>;

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const currentUser = await getOptionalServerUser();
  if (currentUser) {
    redirect("/member");
  }

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
  const rawReferralCode = (await searchParams).ref;
  const referralCode = (
    Array.isArray(rawReferralCode) ? rawReferralCode[0] : rawReferralCode
  )
    ?.trim()
    .toLowerCase()
    .slice(0, 32);

  return (
    <AuthScreen
      mode="register"
      googleClientId={googleClientId}
      referralCode={referralCode}
    />
  );
}
