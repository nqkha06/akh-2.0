"use client"

import type { PropsWithChildren } from "react"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { Toaster } from "sonner"

import { AuthSessionProvider } from "@/components/auth/auth-session-provider"
import { ThemeProvider } from "@/components/theme-provider"

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <AuthSessionProvider>
      <NuqsAdapter>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          themes={["light", "dark"]}
          disableTransitionOnChange
        >
          {children}
          <Toaster position="top-right" />
        </ThemeProvider>
      </NuqsAdapter>
    </AuthSessionProvider>
  )
}
