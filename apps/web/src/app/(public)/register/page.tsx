import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AuthScreen } from "@/components/auth/auth-screen";

export const metadata: Metadata = {
  title: "Tạo tài khoản — Linkicom",
  description: "Tạo tài khoản Linkicom miễn phí.",
};

type SearchParams = Record<string, string | string[] | undefined>;

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (session?.user && session.backendAccessToken && !session.authError) {
    redirect("/member");
  }

  const googleEnabled = Boolean(
    process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
  );
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
      googleEnabled={googleEnabled}
      referralCode={referralCode}
    />
  );
}
