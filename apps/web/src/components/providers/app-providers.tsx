"use client"

import type { PropsWithChildren } from "react"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { Toaster } from "sonner"

import { AuthSessionProvider } from "@/components/auth/auth-session-provider"
import { SiteBrandProvider } from "@/features/site-settings/components/site-brand-provider"
import type { PublicSiteSettings } from "@/features/site-settings/types"

export function AppProviders({
  children,
  settings,
}: PropsWithChildren<{ settings: PublicSiteSettings }>) {
  return (
    <SiteBrandProvider settings={settings}>
      <AuthSessionProvider>
        <NuqsAdapter>
          {children}
          <Toaster position="top-right" />
        </NuqsAdapter>
      </AuthSessionProvider>
    </SiteBrandProvider>
  )
}
