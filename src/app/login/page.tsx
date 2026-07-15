import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AuthScreen } from "@/components/auth/auth-screen";

export const metadata: Metadata = {
  title: "Đăng nhập — Linkicom",
  description: "Đăng nhập Linkicom để quản lý link và theo dõi hiệu suất.",
};

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/member");

  const googleEnabled = Boolean(
    process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
  );

  return <AuthScreen mode="login" googleEnabled={googleEnabled} />;
}
