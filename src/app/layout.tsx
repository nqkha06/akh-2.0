import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";
import { MobileBottomNav } from "@/components/dashboard/mobile-bottom-nav";
import { ThemeProvider } from "../components/theme-provider";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Rekonise",
  description: "Nền tảng rút gọn link kiếm tiền cho nhà sáng tạo nội dung tại Việt Nam. Tạo link, theo dõi hiệu suất và tối ưu thu nhập dễ dàng.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={cn("font-sans", geist.variable)} suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="pb-24 lg:pb-0">{children}</div>
          <Toaster position="top-right" />
          <MobileBottomNav />
        </ThemeProvider>
      </body>
    </html>
  );
}
