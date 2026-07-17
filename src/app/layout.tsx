import type { Metadata } from "next"
import { Geist, Inter } from "next/font/google"
import { NextIntlClientProvider } from "next-intl"
import { getLocale } from "next-intl/server"

import { AppProviders } from "@/components/providers/app-providers"
import { cn } from "@/lib/utils"
import NextTopLoader from "nextjs-toploader";

import "./globals.css"

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "Linkicom — One link. More momentum.",
  description:
    "Create link-in-bio pages, verified social unlocks and protected content experiences that turn creator traffic into real growth.",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()

  return (
    <html
      lang={locale}
      className={cn("font-sans", geist.variable)}
      suppressHydrationWarning
    >
      <body className={cn(inter.variable, "antialiased")}>
        <NextTopLoader
          color="var(--primary)"
          height={3}
          showSpinner={false}
          shadow={false}
          initialPosition={0.08}
          crawlSpeed={200}
          speed={200}
          zIndex={9999}
        />
        <NextIntlClientProvider>
          <AppProviders>{children}</AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
