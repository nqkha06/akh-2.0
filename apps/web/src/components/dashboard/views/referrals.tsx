"use client";

import { Code2, Image as ImageIcon } from "lucide-react";
import {
  BadgeDollarSign,
  CircleDollarSign,
  Copy,
  Gift,
  Link as LinkIcon,
  Share2,
  UserCheck,
  UsersRound,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { PageHeader } from "@/components/dashboard/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const referralLink = "https://rekonise.com/ref/creator";
const referralBanners = [
  { id: "square", dimensions: "250 × 250", previewClass: "aspect-square max-w-60", image: "250x250" },
  { id: "medium", dimensions: "336 × 280", previewClass: "aspect-[6/5] max-w-sm", image: "336x280" },
  { id: "leaderboard", dimensions: "728 × 90", previewClass: "aspect-[8/1] max-w-2xl", image: "728x90" },
  { id: "banner", dimensions: "468 × 60", previewClass: "aspect-[39/5] max-w-xl", image: "468x60" },
] as const;

export function ReferralsView() {
  const t = useTranslations("SimplePages.referrals");

  const copy = async (value: string, message: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(message);
    } catch {
      toast.error(t("copyFailed"));
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
        action={<Badge className="h-9 gap-1.5 bg-emerald-600 px-3 text-sm hover:bg-emerald-600"><BadgeDollarSign className="size-4" />{t("commissionRate")}</Badge>}
      />

      <Card className="gap-0 border-slate-200 bg-slate-50/80 px-4 py-3 shadow-none sm:px-5">
        <p className="flex items-start gap-2 text-sm leading-6 text-slate-600">
          <UsersRound className="mt-0.5 size-4 shrink-0 text-blue-600" />
          {t("context")}
        </p>
      </Card>

      <section className="grid overflow-hidden rounded-xl border bg-card shadow-sm sm:grid-cols-3" aria-label={t("summary")}>
        <ReferralMetric icon={<UsersRound />} label={t("totalReferrals")} value="0" primary />
        <ReferralMetric icon={<BadgeDollarSign />} label={t("commissionLabel")} value="5%" />
        <ReferralMetric icon={<Gift />} label={t("signupBonus")} value="—" />
      </section>

      <Card className="gap-0 overflow-hidden border-slate-200">
        <div className="grid xl:grid-cols-[1.15fr_0.85fr]">
          <div className="border-b xl:border-r xl:border-b-0">
            <CardHeader className="px-5 pt-5 sm:px-6 sm:pt-6">
              <CardTitle>{t("shareTitle")}</CardTitle>
              <CardDescription className="leading-6">{t("shareDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-md border bg-muted/30 px-3">
                <LinkIcon className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate text-sm font-medium text-slate-700">{referralLink}</span>
              </div>
              <Button type="button" className="h-11 sm:w-auto" onClick={() => void copy(referralLink, t("copiedLink"))}>
                <Copy />
                {t("copy")}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                ["X", `https://twitter.com/intent/tweet?url=${encodeURIComponent(referralLink)}`],
                ["Facebook", `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`],
                ["WhatsApp", `https://wa.me/?text=${encodeURIComponent(referralLink)}`],
                ["Telegram", `https://t.me/share/url?url=${encodeURIComponent(referralLink)}`],
              ].map(([label, href]) => (
                <Button key={label} asChild type="button" size="sm" variant="outline">
                  <a href={href} target="_blank" rel="noreferrer"><Share2 />{label}</a>
                </Button>
              ))}
            </div>
            </CardContent>
          </div>

          <div>
            <CardHeader className="px-5 pt-5 sm:px-6 sm:pt-6">
            <CardTitle>{t("howTitle")}</CardTitle>
            <CardDescription>{t("howDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-5 py-5 sm:px-6">
            {[
              [LinkIcon, t("steps.copyTitle"), t("steps.copyDescription")],
              [UserCheck, t("steps.signupTitle"), t("steps.signupDescription")],
              [CircleDollarSign, t("steps.earnTitle"), t("steps.earnDescription")],
            ].map(([Icon, title, description], index) => {
              const StepIcon = Icon as typeof LinkIcon;
              return (
                <div key={title as string} className="flex gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700">{index + 1}</span>
                  <div>
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-800"><StepIcon className="size-4 text-slate-500" />{title as string}</p>
                    <p className="mt-1 text-sm leading-5 text-slate-500">{description as string}</p>
                  </div>
                </div>
              );
            })}
            </CardContent>
          </div>
        </div>

        <div className="border-t">
          <CardHeader className="px-5 pt-5 sm:px-6 sm:pt-6">
            <CardTitle className="flex items-center gap-2"><ImageIcon className="size-5 text-blue-600" />{t("bannersTitle")}</CardTitle>
            <CardDescription className="leading-6">{t("bannersDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
          <Tabs defaultValue={referralBanners[0].id}>
            <TabsList className="h-auto w-full flex-wrap justify-start sm:w-fit">
              {referralBanners.map((banner) => <TabsTrigger key={banner.id} value={banner.id}>{banner.dimensions}</TabsTrigger>)}
            </TabsList>
            {referralBanners.map((banner) => {
              const embedCode = `<a href="${referralLink}"><img src="https://rekonise.com/referral/${banner.image}.png" alt="${t("bannersAlt")}" /></a>`;

              return (
                <TabsContent key={banner.id} value={banner.id} className="mt-5">
                  <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
                    <div>
                      <div className="mb-3 flex items-center justify-between gap-3 text-xs font-medium text-slate-500">
                        <span>{t("livePreview", { size: banner.dimensions })}</span>
                        <Badge variant="secondary">{t("variant", { number: 1 })}</Badge>
                      </div>
                      <div className="flex min-h-64 items-center justify-center rounded-xl border bg-slate-50 p-4">
                        <div className={`relative flex w-full items-center overflow-hidden rounded-lg bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-4 text-white shadow-sm ${banner.previewClass}`}>
                          <div className="absolute -right-10 -bottom-10 size-36 rounded-full bg-white/10" />
                          <div className="relative min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-100">Rekonise referral</p>
                            <p className="mt-1 truncate text-sm font-bold sm:text-base">{t("bannerHeadline")}</p>
                            <p className="mt-1 hidden text-xs text-blue-100 sm:block">{t("bannerSubheadline")}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="flex items-center gap-2 text-sm font-semibold text-slate-800"><Code2 className="size-4 text-slate-500" />{t("embedCode")}</p>
                        <Button type="button" variant="outline" size="sm" onClick={() => void copy(embedCode, t("copiedBanner"))}><Copy />{t("copy")}</Button>
                      </div>
                      <Textarea readOnly value={embedCode} rows={6} className="min-h-36 flex-1 resize-none bg-slate-50 font-mono text-xs leading-5" />
                    </div>
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
          </CardContent>
        </div>
      </Card>

      <Card className="gap-0">
        <CardHeader className="flex flex-col gap-2 border-b sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>{t("tableTitle")}</CardTitle>
            <CardDescription className="mt-1">{t("tableDescription")}</CardDescription>
          </div>
          <Badge variant="secondary">{t("referralCount", { count: 0 })}</Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <caption className="sr-only">{t("tableTitle")}</caption>
              <thead className="border-b bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  {[t("table.details"), t("table.status"), t("table.date"), t("table.lastEarning"), t("table.totalEarnings")].map((label, index) => <th key={label} className={`px-5 py-3 sm:px-6 ${index > 2 ? "text-right" : ""}`}>{label}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={5} className="px-5 py-14 text-center sm:px-6">
                    <div className="mx-auto max-w-md">
                      <span className="mx-auto grid size-12 place-items-center rounded-xl bg-blue-50 text-blue-700"><UsersRound className="size-6" /></span>
                      <p className="mt-4 font-semibold text-slate-900">{t("emptyTitle")}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-500">{t("emptyDescription")}</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ReferralMetric({ icon, label, value, primary = false }: { icon: React.ReactNode; label: string; value: string; primary?: boolean }) {
  return (
    <div className={`border-b p-5 last:border-b-0 sm:border-r sm:border-b-0 sm:last:border-r-0 ${primary ? "bg-blue-600 text-white" : "bg-white"}`}>
      <p className={`flex items-center gap-2 text-sm font-medium ${primary ? "text-blue-100" : "text-slate-500"}`}>{icon}{label}</p>
      <p className={`mt-3 text-3xl font-semibold tracking-tight ${primary ? "text-white" : "text-slate-950"}`}>{value}</p>
    </div>
  );
}
