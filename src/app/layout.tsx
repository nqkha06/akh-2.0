import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { MobileBottomNav } from "@/components/dashboard/mobile-bottom-nav";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SUB Unlock Manager",
  description: "Dashboard quản lý link SUB to unlock.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={cn("font-sans", geist.variable)}>
      <body className={`${inter.variable} antialiased`}>
        <div className="pb-24 lg:pb-0">{children}</div>
        <MobileBottomNav />
      </body>
    </html>
  );
}
