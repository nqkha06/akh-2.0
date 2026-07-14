import type { Metadata } from "next";
import { AuthScreen } from "@/components/auth/auth-screen";

export const metadata: Metadata = { title: "Quên mật khẩu — Linkicom" };

export default function ForgotPasswordPage() {
  return <AuthScreen mode="forgot" />;
}
