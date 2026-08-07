"use client";

import {
  ArrowRight,
  CheckCircle2,
  Flag,
  Loader2,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import pageStyles from "@/app/page.module.css";
import { Footer, Navbar } from "@/components/landing/landing-page";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  PublicMenu,
  WebsiteMenuLocation,
} from "@/features/admin-menus/types";
import {
  createPublicLinkReport,
  type LinkReportReason,
} from "@/features/link-reports/api/link-reports.client";
import type { PublicSiteSettings } from "@/features/site-settings/types";

const reportReasons = [
  "spam",
  "malware",
  "impersonation",
  "copyright",
  "adult",
  "other",
] as const;

type ReportLinkPageProps = {
  dashboardHref: string | null;
  initialDetails: string;
  initialEmail: string;
  initialReason: string;
  initialUrl: string;
  menus?: Partial<Record<WebsiteMenuLocation, PublicMenu>>;
  settings: PublicSiteSettings;
};

export function ReportLinkPage({
  dashboardHref,
  initialDetails,
  initialEmail,
  initialReason,
  initialUrl,
  menus,
  settings,
}: ReportLinkPageProps) {
  const t = useTranslations("ReportLink");
  const [email, setEmail] = useState(initialEmail);
  const [url, setUrl] = useState(initialUrl);
  const [reason, setReason] = useState<LinkReportReason | "">(
    reportReasons.includes(initialReason as LinkReportReason)
      ? (initialReason as LinkReportReason)
      : "",
  );
  const [details, setDetails] = useState(initialDetails);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reference, setReference] = useState("");

  async function submitReport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!isValidEmail(email)) {
      setError(t("errors.email"));
      return;
    }
    const normalizedUrl = normalizeReportUrl(url);
    if (!normalizedUrl) {
      setError(t("errors.url"));
      return;
    }
    if (!reason) {
      setError(t("errors.reason"));
      return;
    }
    if (details.trim().length < 20) {
      setError(t("errors.details"));
      return;
    }

    setSubmitting(true);
    try {
      const report = await createPublicLinkReport({
        email: email.trim().toLowerCase(),
        reportedUrl: normalizedUrl,
        reason,
        details: details.trim(),
      });
      setReference(report.reference);
      toast.success(t("success.toast"));
    } catch (failure) {
      const message =
        failure instanceof Error ? failure.message : t("errors.submit");
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main
      className="min-w-[320px] overflow-x-clip bg-background text-foreground"
      id="top"
    >
      <Navbar
        dashboardHref={dashboardHref}
        fallbackAnchorPrefix="/"
        menus={menus}
        semantic
        settings={settings}
        showThemeToggle
        themeToggleLabel={t("themeToggle")}
      />

      <section className="border-b border-border bg-background pb-14 pt-28 sm:pb-16 sm:pt-32">
        <div className={pageStyles.container}>
          <header className="mx-auto max-w-3xl text-center">
            <span className="type-caption inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-muted-foreground">
              <ShieldCheck aria-hidden="true" className="size-4 text-primary" />
              {t("eyebrow")}
            </span>
            <h1 className="type-page-title mt-5 text-balance">{t("title")}</h1>
            <p className="type-lead mx-auto mt-4 max-w-[42.5rem] text-pretty text-foreground/80">
              {t("description")}
            </p>
          </header>
        </div>
      </section>

      <section className="bg-muted/30 py-12 sm:py-16 lg:py-20">
        <div
          className={`${pageStyles.container} grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.48fr)]`}
        >
          <Card className="gap-0 py-0">
              <CardHeader className="border-b border-border p-5 sm:p-6">
                <CardTitle className="type-card-title">
                  {t("form.title")}
                </CardTitle>
                <CardDescription className="type-body-sm text-foreground/70">
                  {t("form.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 sm:p-6">
                {reference ? (
                  <div className="flex min-h-80 flex-col items-center justify-center text-center">
                    <span className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary">
                      <CheckCircle2 aria-hidden="true" className="size-6" />
                    </span>
                    <h2 className="type-card-title mt-5">
                      {t("success.title")}
                    </h2>
                    <p className="type-body mt-2 max-w-md text-foreground/70">
                      {t("success.description")}
                    </p>
                    <p className="type-label mt-4 rounded-lg border border-border bg-muted px-3 py-2 font-mono">
                      {reference}
                    </p>
                    <Button asChild className="mt-6">
                      <Link href="/">
                        {t("success.action")} <ArrowRight aria-hidden="true" />
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <form className="space-y-5" onSubmit={submitReport}>
                    <div className="space-y-2">
                      <Label htmlFor="reporter-email">{t("fields.email")}</Label>
                      <Input
                        autoComplete="email"
                        id="reporter-email"
                        inputMode="email"
                        maxLength={320}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder={t("fields.emailPlaceholder")}
                        required
                        type="email"
                        value={email}
                      />
                      <p className="type-caption text-muted-foreground">
                        {t("fields.emailHelp")}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reported-url">{t("fields.url")}</Label>
                      <Input
                        id="reported-url"
                        inputMode="url"
                        maxLength={500}
                        onChange={(event) => setUrl(event.target.value)}
                        placeholder={t("fields.urlPlaceholder")}
                        required
                        type="url"
                        value={url}
                      />
                      <p className="type-caption text-muted-foreground">
                        {t("fields.urlHelp")}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="report-reason">
                        {t("fields.reason")}
                      </Label>
                      <Select
                        onValueChange={(value) =>
                          setReason(value as LinkReportReason)
                        }
                        value={reason}
                      >
                        <SelectTrigger className="w-full" id="report-reason">
                          <SelectValue placeholder={t("fields.reasonPlaceholder")} />
                        </SelectTrigger>
                        <SelectContent>
                          {reportReasons.map((item) => (
                            <SelectItem key={item} value={item}>
                              {t(`reasons.${item}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="report-details">
                        {t("fields.details")}
                      </Label>
                      <Textarea
                        id="report-details"
                        maxLength={5_000}
                        minLength={20}
                        onChange={(event) => setDetails(event.target.value)}
                        placeholder={t("fields.detailsPlaceholder")}
                        required
                        rows={7}
                        value={details}
                      />
                      <p className="type-caption text-muted-foreground">
                        {t("fields.detailsHelp")}
                      </p>
                    </div>

                    {error ? (
                      <Alert variant="destructive">
                        <TriangleAlert aria-hidden="true" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    ) : null}

                    <Button className="w-full sm:w-auto" disabled={submitting}>
                      {submitting ? (
                        <Loader2 aria-hidden="true" className="animate-spin" />
                      ) : (
                        <Flag aria-hidden="true" />
                      )}
                      {submitting ? t("form.submitting") : t("form.submit")}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>

          <aside className="space-y-4">
            <Card className="gap-0 py-0">
              <CardHeader className="p-5 sm:p-6">
                <span className="grid size-10 place-items-center rounded-lg bg-muted text-primary">
                  <ShieldCheck aria-hidden="true" className="size-5" />
                </span>
                <CardTitle className="type-card-title mt-4">
                  {t("guidance.title")}
                </CardTitle>
                <CardDescription className="type-body-sm text-foreground/70">
                  {t("guidance.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="border-t border-border p-5 sm:p-6">
                <ul className="type-body-sm space-y-3 text-foreground/75">
                  <li>{t("guidance.items.url")}</li>
                  <li>{t("guidance.items.evidence")}</li>
                  <li>{t("guidance.items.privacy")}</li>
                </ul>
              </CardContent>
            </Card>

            <Alert>
              <TriangleAlert aria-hidden="true" />
              <AlertDescription>{t("urgent")}</AlertDescription>
            </Alert>
          </aside>
        </div>
      </section>

      <Footer
        fallbackAnchorPrefix="/"
        menus={menus}
        semantic
        settings={settings}
      />
    </main>
  );
}

function normalizeReportUrl(value: string) {
  try {
    const url = new URL(value.trim());
    if (!(["http:", "https:"] as string[]).includes(url.protocol)) return null;
    return url.toString().slice(0, 500);
  } catch {
    return null;
  }
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
