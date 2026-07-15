"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CircleAlert, ExternalLink, LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import SocialLinksGenerator from "@/features/link-creation/components/link-creator";
import { getLinks, type LinkDto } from "@/lib/api-client";

function getCachedLink(linkId: string) {
  try {
    const value = sessionStorage.getItem(`social-link-edit:${linkId}`);
    if (!value) return undefined;

    const link = JSON.parse(value) as LinkDto;
    return link.id === linkId ? link : undefined;
  } catch {
    return undefined;
  }
}

function cacheLink(link: LinkDto) {
  try {
    sessionStorage.setItem(`social-link-edit:${link.id}`, JSON.stringify(link));
  } catch {
    // Caching is only a fallback for demo links and unavailable APIs.
  }
}

export function LinkEditPage({ linkId }: { linkId: string }) {
  const t = useTranslations("LinkCard");
  const linksT = useTranslations("Links");
  const commonT = useTranslations("Common");
  const dashboardT = useTranslations("Dashboard.nav");
  const [link, setLink] = useState<LinkDto>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLink = useCallback(async () => {
    const cachedLink = getCachedLink(linkId);

    try {
      setLoading(true);
      setError("");
      const links = await getLinks();
      const currentLink = links.find((item) => item.id === linkId) ?? cachedLink;

      if (!currentLink) {
        throw new Error(linksT("notFound"));
      }

      setLink(currentLink);
      cacheLink(currentLink);
    } catch (loadError) {
      if (cachedLink) {
        setLink(cachedLink);
        setError("");
      } else {
        setError(loadError instanceof Error ? loadError.message : linksT("loadErrorFallback"));
      }
    } finally {
      setLoading(false);
    }
  }, [linkId, linksT]);

  useEffect(() => {
    void Promise.resolve().then(loadLink);
  }, [loadLink]);

  if (loading) return <LinkEditLoading />;

  if (error || !link) {
    return (
      <LinkEditError
        message={error || linksT("notFound")}
        onRetry={() => void loadLink()}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-5">
      <Breadcrumb className="text-[13px] sm:text-sm">
        <BreadcrumbList className="gap-1.5 sm:gap-2.5">
          <BreadcrumbItem className="hidden sm:inline-flex">
            <BreadcrumbLink asChild><Link href="/member">{commonT("home")}</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="hidden sm:block" />
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link href="/member/links">{dashboardT("links")}</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>{commonT("edit")}</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="border-b border-border pb-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-2.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild variant="ghost" size="icon" className="mt-0.5 size-11 shrink-0 sm:size-9">
                  <Link href="/member/links" aria-label={dashboardT("links")}><ArrowLeft className="size-[18px]" /></Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{dashboardT("links")}</TooltipContent>
            </Tooltip>

            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-[-0.025em] text-foreground sm:text-[1.75rem]">{t("editTitle")}</h1>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">{t("editDescription")}</p>
            </div>
          </div>

          <Button asChild variant="outline" size="sm" className="h-10 sm:h-9">
            <Link href={`/l/${link.slug}`} target="_blank" rel="noreferrer">
              <ExternalLink />
              /l/{link.slug}
            </Link>
          </Button>
        </div>
      </div>

      <SocialLinksGenerator
        key={link.id}
        embedded
        initialLink={link}
        onSaved={(updatedLink) => {
          setLink(updatedLink);
          cacheLink(updatedLink);
        }}
      />
    </div>
  );
}

function LinkEditLoading() {
  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-5">
      <div className="border-b border-border pb-5">
        <Skeleton className="mb-3 h-5 w-48" />
        <Skeleton className="h-8 w-72" />
        <Skeleton className="mt-2 h-4 w-[34rem] max-w-full" />
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
        <div className="space-y-4">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
        <Skeleton className="h-[640px] rounded-xl" />
      </div>
    </div>
  );
}

function LinkEditError({ message, onRetry }: { message: string; onRetry: () => void }) {
  const t = useTranslations("Links");

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-5">
      <Button asChild variant="ghost" size="icon" className="size-11 sm:size-9">
        <Link href="/member/links" aria-label="Social links"><ArrowLeft /></Link>
      </Button>
      <Alert variant="destructive">
        <CircleAlert />
        <AlertTitle>{t("loadErrorTitle")}</AlertTitle>
        <AlertDescription>
          <p>{message}</p>
          <Button variant="outline" className="mt-3 bg-background" onClick={onRetry}>
            <LoaderCircle />
            {t("tryAgain")}
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}
