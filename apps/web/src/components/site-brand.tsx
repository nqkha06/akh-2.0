"use client";

import Image from "next/image";
import Link from "next/link";

import { useSiteBrand } from "@/features/site-settings/components/site-brand-provider";
import { cn } from "@/lib/utils";

export function SiteBrandMark({
  className,
  imageClassName,
}: {
  className?: string;
  imageClassName?: string;
}) {
  const settings = useSiteBrand();
  const icon =
    settings.branding.logoIcon ??
    settings.branding.logoLight ??
    settings.branding.logoDark;
  const fallback = (settings.siteShortName || settings.siteName)
    .trim()
    .charAt(0)
    .toLocaleUpperCase();

  return (
    <span
      className={cn(
        "relative grid size-8 shrink-0 place-items-center overflow-hidden rounded-lg border bg-card text-sm font-semibold text-foreground",
        className,
      )}
      aria-hidden="true"
    >
      {icon ? (
        <Image
          src={icon.downloadUrl}
          alt=""
          fill
          sizes="40px"
          unoptimized
          className={cn("object-contain", imageClassName)}
        />
      ) : (
        fallback
      )}
    </span>
  );
}

export function SiteBrandName({ className }: { className?: string }) {
  const settings = useSiteBrand();
  return (
    <span className={cn("truncate", className)}>
      {settings.siteShortName || settings.siteName}
    </span>
  );
}

export function SiteBrandDisplay({
  className,
  logoClassName,
  nameClassName,
}: {
  className?: string;
  logoClassName?: string;
  nameClassName?: string;
}) {
  const settings = useSiteBrand();
  const lightLogo = settings.branding.logoLight;
  const darkLogo = settings.branding.logoDark;

  if (lightLogo || darkLogo) {
    return (
      <span
        className={cn(
          "relative block h-9 w-36 shrink-0",
          logoClassName,
          className,
        )}
        aria-label={settings.siteName}
      >
        {lightLogo ? (
          <Image
            src={lightLogo.downloadUrl}
            alt={settings.siteName}
            fill
            sizes="144px"
            unoptimized
            className={cn(
              "object-contain object-left",
              darkLogo && "dark:hidden",
            )}
          />
        ) : null}
        {darkLogo ? (
          <Image
            src={darkLogo.downloadUrl}
            alt={settings.siteName}
            fill
            sizes="144px"
            unoptimized
            className={cn(
              "object-contain object-left",
              lightLogo && "hidden dark:block",
            )}
          />
        ) : null}
      </span>
    );
  }

  return (
    <span className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <SiteBrandMark className={logoClassName} />
      <SiteBrandName className={nameClassName} />
    </span>
  );
}

export function SiteBrandLink({
  href = "/",
  className,
  logoClassName,
  nameClassName,
}: {
  href?: string;
  className?: string;
  logoClassName?: string;
  nameClassName?: string;
}) {
  const settings = useSiteBrand();
  return (
    <Link
      href={href}
      aria-label={`${settings.siteName} — Trang chủ`}
      className={cn("flex min-w-0 items-center gap-2.5", className)}
    >
      <SiteBrandMark className={logoClassName} />
      <SiteBrandName className={nameClassName} />
    </Link>
  );
}
