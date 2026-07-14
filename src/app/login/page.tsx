import type { Metadata } from "next";
import { AuthScreen } from "@/components/auth/auth-screen";

export const metadata: Metadata = { title: "Đăng nhập — Linkicom" };

export default function LoginPage() {
  return <AuthScreen mode="login" />;
}
