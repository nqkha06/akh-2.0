import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title: "Admin Console — Linkicom",
  description: "Không gian vận hành và quản trị hệ thống Linkicom.",
};

const backendApiUrl = (
  process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL
)?.replace(/\/$/, "");

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || !session.backendAccessToken || session.authError) {
    redirect(`/login?callbackUrl=${encodeURIComponent("/admin")}`);
  }

  if (!backendApiUrl) {
    redirect("/member");
  }

  let currentUser: { role?: string } | null = null;
  try {
    const response = await fetch(`${backendApiUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${session.backendAccessToken}` },
      cache: "no-store",
    });
    if (response.ok) currentUser = (await response.json()) as { role?: string };
  } catch {
    currentUser = null;
  }

  if (!currentUser) {
    redirect(`/login?callbackUrl=${encodeURIComponent("/admin")}&reason=session-expired`);
  }
  if (currentUser.role?.toLowerCase() !== "admin") redirect("/member");

  return (
    <div className="min-h-svh bg-background text-foreground">
      <TooltipProvider>{children}</TooltipProvider>
    </div>
  );
}
