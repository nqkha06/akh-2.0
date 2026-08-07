import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import pageStyles from "@/app/page.module.css";
import { Footer, Navbar } from "@/components/landing/landing-page";
import { getPublicMenus } from "@/features/admin-menus/api/public-menus.server";
import { getPublicPage } from "@/features/pages/api/public-pages.server";
import { PublicPageContent } from "@/features/pages/components/public-page-content";
import { getPublicSiteSettings } from "@/features/site-settings/api/public-settings.server";
import { getDashboardHref } from "@/lib/auth/redirects";
import { getOptionalServerUser } from "@/lib/auth/server-session";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublicPage(slug);
  if (!page) return { robots: { index: false, follow: false } };

  const title = page.seoTitle || page.title;
  const description = page.seoDescription || page.excerpt || undefined;
  const image = page.featuredImage?.url;
  return {
    title,
    description,
    keywords:
      page.seoKeywords
        ?.split(",")
        .map((keyword) => keyword.trim())
        .filter(Boolean) || undefined,
    alternates: { canonical: page.canonicalUrl || `/${page.slug}` },
    robots: {
      index: page.robotsIndex,
      follow: page.robotsFollow,
    },
    openGraph: {
      title,
      description,
      type: "article",
      url: `/${page.slug}`,
      images: image ? [{ url: image, alt: page.title }] : undefined,
    },
  };
}

export default async function PublicContentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getLocale();
  const [page, settings, menus, currentUser] = await Promise.all([
    getPublicPage(slug),
    getPublicSiteSettings(),
    getPublicMenus(locale, [
      "header-primary",
      "header-actions",
      "mobile-primary",
      "footer-primary",
      "footer-legal",
    ]),
    getOptionalServerUser(),
  ]);
  if (!page) notFound();

  return (
    <main className={pageStyles.page} id="top">
      <Navbar
        dashboardHref={currentUser ? getDashboardHref(currentUser) : null}
        fallbackAnchorPrefix="/"
        menus={menus.menus}
        semantic
        settings={settings}
        showThemeToggle
      />
      <div className="pt-[68px]">
        <PublicPageContent page={page} />
      </div>
      <Footer
        fallbackAnchorPrefix="/"
        menus={menus.menus}
        semantic
        settings={settings}
      />
    </main>
  );
}
