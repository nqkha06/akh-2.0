import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AuthScreen } from "@/components/auth/auth-screen";

export const metadata: Metadata = {
  title: "Tạo tài khoản — Linkicom",
  description: "Tạo tài khoản Linkicom miễn phí.",
};

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/member");

  const googleEnabled = Boolean(
    process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
  );

  return <AuthScreen mode="register" googleEnabled={googleEnabled} />;
}
