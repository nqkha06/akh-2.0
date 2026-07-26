import {
  BadgeDollarSign,
  CircleDollarSign,
  Globe2,
  Info,
  Monitor,
  Smartphone,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import pageStyles from "@/app/page.module.css";
import { Footer, Navbar } from "@/components/landing/landing-page";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  PublicMenu,
  WebsiteMenuLocation,
} from "@/features/admin-menus/types";
import type {
  PublicPayoutRate,
  PublicPayoutRateLevel,
} from "@/features/public-payout-rates/types";
import type { PublicSiteSettings } from "@/features/site-settings/types";

type Translator = (key: string) => string;

type PayoutRatesPageProps = {
  locale: string;
  menus?: Partial<Record<WebsiteMenuLocation, PublicMenu>>;
  payoutRateLevel: PublicPayoutRateLevel | null;
  settings: PublicSiteSettings;
  t: Translator;
};

type Benefit = {
  icon: LucideIcon;
  titleKey: string;
  descriptionKey: string;
};

type PayoutRate = {
  countryCode: string;
  mobile: PayoutAmount | null;
  desktop: PayoutAmount | null;
};

type PayoutAmount = {
  value: number;
  currency: string;
};

const benefits: Benefit[] = [
  {
    icon: CircleDollarSign,
    titleKey: "benefits.fastPayout.title",
    descriptionKey: "benefits.fastPayout.description",
  },
  {
    icon: Globe2,
    titleKey: "benefits.globalTraffic.title",
    descriptionKey: "benefits.globalTraffic.description",
  },
  {
    icon: UsersRound,
    titleKey: "benefits.referrals.title",
    descriptionKey: "benefits.referrals.description",
  },
];

function formatMoney(amount: PayoutAmount | null, locale: string) {
  if (!amount) return "—";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: amount.currency,
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(amount.value);
}

function buildPayoutRates(
  level: PublicPayoutRateLevel | null,
): PayoutRate[] {
  if (!level) return [];

  const countryCodes = Array.from(
    new Set(level.rates.map((rate) => rate.countryCode)),
  );

  return countryCodes.map((countryCode) => ({
    countryCode,
    mobile: resolvePayoutAmount(level, countryCode, "mobile"),
    desktop: resolvePayoutAmount(level, countryCode, "desktop"),
  }));
}

function resolvePayoutAmount(
  level: PublicPayoutRateLevel | null,
  countryCode: string,
  deviceType: "mobile" | "desktop",
): PayoutAmount | null {
  if (!level) return null;

  const rate = findRate(level.rates, countryCode, deviceType);
  if (!rate) return null;

  const baseCpm = Number(rate.baseCpm);
  if (!Number.isFinite(baseCpm)) return null;

  return {
    value: baseCpm * (level.profitBps / 10_000),
    currency: rate.currency,
  };
}

function findRate(
  rates: PublicPayoutRate[],
  countryCode: string,
  deviceType: "mobile" | "desktop",
) {
  return rates.find(
    (rate) =>
      rate.countryCode === countryCode && rate.deviceType === deviceType,
  ) ?? rates.find(
    (rate) => rate.countryCode === countryCode && rate.deviceType === "any",
  );
}

function CountryMark({
  code,
  label,
}: {
  code: string;
  label: string;
}) {
  if (code !== "ALL") {
    const flagCode = code === "ZZ" ? "xx" : code.toLowerCase();

    return (
      <span
        aria-label={label}
        className="grid size-11 shrink-0 place-items-center rounded-lg border border-border bg-muted"
        role="img"
      >
        <span
          aria-hidden="true"
          className={`fi fi-${flagCode} rounded-[2px] text-2xl shadow-sm ring-1 ring-foreground/10`}
        />
      </span>
    );
  }

  return (
    <span
      aria-label={label}
      className="grid size-11 shrink-0 place-items-center rounded-lg border border-border bg-muted text-muted-foreground"
      role="img"
    >
      <Globe2 aria-hidden="true" className="size-5" />
    </span>
  );
}

function countryName(countryCode: string, locale: string, t: Translator) {
  if (countryCode === "ALL") return t("countries.otherCountries");
  if (countryCode === "ZZ") return t("countries.unknownCountry");

  return new Intl.DisplayNames([locale], { type: "region" }).of(countryCode) ??
    t("countries.unknownCountry");
}

function DeviceRate({
  Icon,
  device,
  label,
  value,
}: {
  Icon: LucideIcon;
  device: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
        <Icon aria-hidden="true" className="size-[18px]" />
      </span>
      <div className="min-w-0">
        <p className="type-label text-muted-foreground">{device}</p>
        <p className="type-metric mt-1 text-foreground tabular-nums">
          {value}
        </p>
        <p className="type-body-sm mt-1 text-muted-foreground">
          {label}
        </p>
      </div>
    </div>
  );
}

export function PayoutRatesPage({
  locale,
  menus,
  payoutRateLevel,
  settings,
  t,
}: PayoutRatesPageProps) {
  const payoutRates = buildPayoutRates(payoutRateLevel);

  return (
    <main
      className="min-w-[320px] overflow-x-clip bg-background text-foreground"
      id="top"
    >
      <Navbar
        fallbackAnchorPrefix="/"
        menus={menus}
        semantic
        settings={settings}
        showThemeToggle
        themeToggleLabel={t("themeToggle")}
      />

      <section className="border-b border-border bg-background pb-16 pt-28 sm:pb-20 sm:pt-32">
        <div className={pageStyles.container}>
          <header className="mx-auto max-w-3xl text-center">
            <span className="type-caption inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-muted-foreground">
              <BadgeDollarSign aria-hidden="true" className="size-4 text-primary" />
              {t("eyebrow")}
            </span>
            <h1 className="type-page-title mt-5 text-balance">
              {t("title")}
            </h1>
            <p className="type-lead mx-auto mt-4 max-w-[42.5rem] text-pretty text-foreground/80">
              {t("description")}
            </p>
          </header>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:mt-14 lg:grid-cols-3">
            {benefits.map(({ icon: Icon, titleKey, descriptionKey }) => (
              <Card className="h-full gap-0 py-0" key={titleKey}>
                <CardHeader className="gap-4 p-5 sm:p-6">
                  <span className="grid size-11 place-items-center rounded-lg bg-muted text-primary">
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                  <div className="space-y-2">
                    <CardTitle className="type-card-title">
                      {t(titleKey)}
                    </CardTitle>
                    <CardDescription className="type-body text-foreground/75">
                      {t(descriptionKey)}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section
        aria-labelledby="rates-heading"
        className="bg-muted/30 py-16 sm:py-20"
      >
        <div className={pageStyles.container}>
          <div className="mb-8 max-w-2xl">
            <h2
              className="type-section-title"
              id="rates-heading"
            >
              {t("ratesTitle")}
            </h2>
            <p className="type-body mt-3 text-foreground/80">
              {t("ratesDescription")}
            </p>
          </div>

          <div className="space-y-3">
            {payoutRates.map((rate) => {
              const countryLabel = countryName(rate.countryCode, locale, t);

              return (
                <Card
                  className="gap-0 overflow-hidden py-0"
                  key={rate.countryCode}
                >
                  <CardContent className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(15rem,1.1fr)_minmax(12rem,0.8fr)_minmax(12rem,0.8fr)] lg:items-center">
                    <div className="flex min-w-0 items-center gap-4">
                      <CountryMark code={rate.countryCode} label={countryLabel} />
                      <div className="min-w-0">
                        <p className="type-card-title text-foreground">
                          {countryLabel}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-5 border-t border-border pt-5 sm:grid-cols-2 lg:contents lg:border-0 lg:pt-0">
                      <DeviceRate
                        Icon={Smartphone}
                        device={t("devices.mobile")}
                        label={t("perThousand")}
                        value={formatMoney(rate.mobile, locale)}
                      />
                      <DeviceRate
                        Icon={Monitor}
                        device={t("devices.desktop")}
                        label={t("perThousand")}
                        value={formatMoney(rate.desktop, locale)}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {payoutRates.length === 0 ? (
              <Card className="gap-0 border-dashed py-0">
                <CardContent className="type-body p-8 text-center text-foreground/75">
                  {t("noRates")}
                </CardContent>
              </Card>
            ) : null}
          </div>

          <div
            className="type-body-sm mt-6 flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-foreground/75 sm:p-5"
            role="note"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-primary">
              <Info aria-hidden="true" className="size-[18px]" />
            </span>
            <div>
              <p className="type-label text-foreground">{t("noteTitle")}</p>
              <p className="mt-1">{t("note")}</p>
            </div>
          </div>
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
