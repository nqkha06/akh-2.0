import { Bell, CreditCard, KeyRound, Palette, ShieldCheck, User } from "lucide-react";
import { useTranslations } from "next-intl";

import { AppButton, Badge, PageHeader, SoftCard } from "@/components/dashboard/ui";

export function AccountView() {
  const t = useTranslations("Account");

  const settingCards = [
    [User, t("cards.personal"), t("cards.personalDesc")],
    [KeyRound, t("cards.password"), t("cards.passwordDesc")],
    [CreditCard, t("cards.payout"), t("cards.payoutDesc")],
    [Bell, t("cards.notifications"), t("cards.notificationsDesc")],
    [Palette, t("cards.preferences"), t("cards.preferencesDesc")],
    [ShieldCheck, t("cards.verification"), t("cards.verificationDesc")],
  ] as const;

  return (
    <>
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
      />
      <section className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <SoftCard className="p-6">
          <div className="grid size-20 place-items-center rounded-lg bg-amber-100 text-3xl font-bold text-amber-800 ring-1 ring-amber-200">
            Q
          </div>
          <h2 className="mt-5 text-2xl font-bold text-slate-950">qkha</h2>
          <p className="text-sm font-semibold text-slate-500">
            creator@Rekonise.local
          </p>
          <div className="mt-4">
            <Badge tone="emerald">{t("verified")}</Badge>
          </div>
          <AppButton variant="secondary" className="mt-6 w-full">
            <User size={16} />
            {t("editProfile")}
          </AppButton>
        </SoftCard>

        <div className="grid gap-4 md:grid-cols-2">
          {settingCards.map(([Icon, title, desc]) => (
            <SoftCard key={title} className="p-5">
              <span className="grid size-11 place-items-center rounded-lg bg-blue-50 text-blue-600">
                <Icon size={20} />
              </span>
              <h3 className="mt-4 font-bold text-slate-950">{title}</h3>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                {desc}
              </p>
            </SoftCard>
          ))}
        </div>
      </section>
    </>
  );
}
