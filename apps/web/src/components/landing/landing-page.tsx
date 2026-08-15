"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  Download,
  FileCheck2,
  Globe2,
  Link2,
  Languages,
  LockKeyhole,
  Menu,
  MessageCircle,
  MousePointerClick,
  Moon,
  Play,
  Quote,
  Settings2,
  Sparkles,
  Sun,
  TrendingUp,
  X,
} from "lucide-react";
import {
  SiApplemusic,
  SiAppstore,
  SiBehance,
  SiBluesky,
  SiDiscord,
  SiDribbble,
  SiFacebook,
  SiGoogleplay,
  SiGithub,
  SiInstagram,
  SiReddit,
  SiRoblox,
  SiSnapchat,
  SiSoundcloud,
  SiSpotify,
  SiTelegram,
  SiThreads,
  SiTiktok,
  SiTwitch,
  SiWhatsapp,
  SiX,
  SiYoutube,
} from "@icons-pack/react-simple-icons";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";
import styles from "@/app/page.module.css";
import { Button } from "@/components/ui/button";
import {
  landingTestimonials,
  type LandingTestimonial,
} from "@/components/landing/landing-testimonials";
import { useUiLanguages } from "@/features/languages/hooks/use-ui-languages";
import type {
  PublicSiteSettings,
  SocialPlatform,
} from "@/features/site-settings/types";
import type {
  PublicMenu,
  WebsiteMenuLocation,
} from "@/features/admin-menus/types";
import {
  defaultLocale,
  localeCookieName,
  type AppLocale,
} from "@/i18n/config";

const easing = [0.22, 1, 0.36, 1] as const;

const fallbackFooterSocials = [
  "instagram",
  "youtube",
  "tiktok",
  "x",
  "discord",
] as const satisfies readonly SocialPlatform[];

const supportedFooterSocials = new Set<SocialPlatform>([
  "facebook",
  "youtube",
  "instagram",
  "tiktok",
  "x",
  "linkedin",
  "github",
  "discord",
  "telegram",
  "zalo",
]);

function resolveFooterSocialPlatform(value: string | null): SocialPlatform | null {
  return value && supportedFooterSocials.has(value as SocialPlatform)
    ? value as SocialPlatform
    : null;
}

const socialPlatformLabels: Record<SocialPlatform, string> = {
  facebook: "Facebook",
  youtube: "YouTube",
  instagram: "Instagram",
  tiktok: "TikTok",
  x: "X",
  linkedin: "LinkedIn",
  github: "GitHub",
  discord: "Discord",
  telegram: "Telegram",
  zalo: "Zalo",
};

function LinkedinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" focusable="false" {...props}>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.23 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
    </svg>
  );
}

function FooterSocialIcon({ platform }: { platform: SocialPlatform }) {
  switch (platform) {
    case "facebook": return <SiFacebook aria-hidden="true" size={18} />;
    case "youtube": return <SiYoutube aria-hidden="true" size={18} />;
    case "instagram": return <SiInstagram aria-hidden="true" size={18} />;
    case "tiktok": return <SiTiktok aria-hidden="true" size={18} />;
    case "x": return <SiX aria-hidden="true" size={17} />;
    case "linkedin": return <LinkedinIcon aria-hidden="true" height={18} width={18} />;
    case "github": return <SiGithub aria-hidden="true" size={18} />;
    case "discord": return <SiDiscord aria-hidden="true" size={19} />;
    case "telegram": return <SiTelegram aria-hidden="true" size={18} />;
    case "zalo": return <MessageCircle aria-hidden="true" size={19} />;
  }
}

function Reveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: easing }}
    >
      {children}
    </motion.div>
  );
}

function Logo({ settings }: { settings: PublicSiteSettings }) {
  const t = useTranslations("Landing.nav");
  const lightLogo = settings.branding.logoLight;
  const darkLogo = settings.branding.logoDark;
  return (
    <a className={styles.logo} href="#top" aria-label={t("homeAria", { site: settings.siteName })}>
      {lightLogo ? (
        <span className="relative block h-9 w-32">
          <Image
            src={lightLogo.downloadUrl}
            alt={settings.siteName}
            fill
            unoptimized
            className={`object-contain object-left ${darkLogo ? "dark:hidden" : ""}`}
          />
          {darkLogo ? (
            <Image
              src={darkLogo.downloadUrl}
              alt={settings.siteName}
              fill
              unoptimized
              className="hidden object-contain object-left dark:block"
            />
          ) : null}
        </span>
      ) : (
        <>
          <span className={styles.logoMark} aria-hidden="true"><i /><i /></span>
          <span>{settings.siteName}</span>
        </>
      )}
    </a>
  );
}

function PublicThemeToggle({ label }: { label: string }) {
  const { theme = "light", setTheme } = useTheme();

  return (
    <Button
      aria-label={label}
      className={styles.publicThemeButton}
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      size="icon-lg"
      title={label}
      type="button"
      variant="ghost"
    >
      <Sun aria-hidden="true" className="dark:hidden" />
      <Moon aria-hidden="true" className="hidden dark:block" />
      <span className={styles.publicThemeLabel}>{label}</span>
    </Button>
  );
}

function LandingLanguageSwitcher() {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("Common");
  const uiLanguages = useUiLanguages();
  const [isPending, startTransition] = useTransition();

  function changeLocale(nextLocale: AppLocale) {
    if (nextLocale === locale) return;
    document.cookie = `${localeCookieName}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => window.location.reload());
  }

  return (
    <label className={styles.landingLanguage}>
      <Languages aria-hidden="true" size={16} />
      <span className="sr-only">{t("language")}</span>
      <select
        aria-label={t("language")}
        disabled={isPending}
        onChange={(event) => changeLocale(event.target.value as AppLocale)}
        value={locale || defaultLocale}
      >
        {uiLanguages.items.map((option) => (
          <option key={option.locale} value={option.locale}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

function resolvePublicHref(href: string, anchorPrefix: string) {
  return anchorPrefix && href.startsWith("#") ? `${anchorPrefix}${href}` : href;
}

export function Navbar({
  settings,
  menus,
  dashboardHref = null,
  semantic = false,
  showThemeToggle = false,
  preferFallbackNavigation = false,
  themeToggleLabel = "Toggle color theme",
  fallbackAnchorPrefix = "",
}: {
  settings: PublicSiteSettings;
  menus?: Partial<Record<WebsiteMenuLocation, PublicMenu>>;
  dashboardHref?: string | null;
  semantic?: boolean;
  showThemeToggle?: boolean;
  preferFallbackNavigation?: boolean;
  themeToggleLabel?: string;
  fallbackAnchorPrefix?: string;
}) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("Landing.nav");
  const resolvedThemeToggleLabel = themeToggleLabel === "Toggle color theme" ? t("themeToggle") : themeToggleLabel;
  const fallbackLinks = [
    { id: -1, label: t("whyUs"), href: `${fallbackAnchorPrefix}#why-us`, target: "_self" as const, rel: null },
    { id: -2, label: t("features"), href: `${fallbackAnchorPrefix}#features`, target: "_self" as const, rel: null },
    { id: -3, label: t("faqs"), href: `${fallbackAnchorPrefix}#faqs`, target: "_self" as const, rel: null },
    { id: -4, label: t("getStarted"), href: `${fallbackAnchorPrefix}#get-started`, target: "_self" as const, rel: null },
  ];
  const links = !preferFallbackNavigation && menus?.["header-primary"]?.items.length
    ? menus["header-primary"].items
    : fallbackLinks;
  const mobileLinks = !preferFallbackNavigation && menus?.["mobile-primary"]?.items.length
    ? menus["mobile-primary"].items
    : links;
  const actions = dashboardHref
    ? [
        {
          id: -7,
          label: t("dashboard"),
          href: dashboardHref,
          target: "_self" as const,
          rel: null,
        },
      ]
    : !preferFallbackNavigation && menus?.["header-actions"]?.items.length
      ? menus["header-actions"].items
      : [
          { id: -5, label: t("signIn"), href: "/login", target: "_self" as const, rel: null },
          { id: -6, label: t("startCreating"), href: "/register", target: "_self" as const, rel: null },
        ];

  return (
    <header className={`${styles.navbar} ${semantic ? styles.semanticNavbar : ""}`}>
      <nav className={styles.navInner} aria-label={t("mainNavigation")}>
        <Logo settings={settings} />
        <div className={styles.navLinks}>
          {links.map((item) => item.href ? <a key={item.id} href={resolvePublicHref(item.href, fallbackAnchorPrefix)} target={item.target} rel={item.rel ?? undefined}>{item.label}</a> : null)}
        </div>
        <div className={styles.navActions}>
          {showThemeToggle ? <PublicThemeToggle label={resolvedThemeToggleLabel} /> : null}
          {actions.map((item, index) => item.href ? (
            <a
              className={index === actions.length - 1 ? styles.smallPrimary : styles.textButton}
              href={resolvePublicHref(item.href, fallbackAnchorPrefix)}
              key={item.id}
              target={item.target}
              rel={item.rel ?? undefined}
            >
              {item.label}
              {index === actions.length - 1 ? <ArrowRight size={15} /> : null}
            </a>
          ) : null)}
        </div>
        <button className={styles.menuButton} onClick={() => setOpen(!open)} aria-label={open ? t("closeNavigation") : t("openNavigation")} aria-expanded={open}>
          {open ? <X size={21} /> : <Menu size={21} />}
        </button>
      </nav>
      <AnimatePresence>
        {open && (
          <motion.div className={styles.mobileMenu} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            {mobileLinks.map((item) => item.href ? <a key={item.id} href={resolvePublicHref(item.href, fallbackAnchorPrefix)} target={item.target} rel={item.rel ?? undefined} onClick={() => setOpen(false)}>{item.label}</a> : null)}
            {actions.map((item, index) => item.href ? <a className={index === actions.length - 1 ? styles.smallPrimary : undefined} href={resolvePublicHref(item.href, fallbackAnchorPrefix)} key={item.id} target={item.target} rel={item.rel ?? undefined} onClick={() => setOpen(false)}>{item.label}{index === actions.length - 1 ? <ArrowRight size={15} /> : null}</a> : null)}
            {showThemeToggle ? <PublicThemeToggle label={resolvedThemeToggleLabel} /> : null}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function HeroPhone() {
  const t = useTranslations("Landing.hero.preview");
  return (
    <div className={styles.heroVisual} aria-label={t("ariaLabel")}>
      <div className={`${styles.platformFloat} ${styles.floatYoutube}`}><SiYoutube size={19} /></div>
      <div className={`${styles.platformFloat} ${styles.floatInstagram}`}><SiInstagram size={19} /></div>
      <div className={`${styles.platformFloat} ${styles.floatDiscord}`}><SiDiscord size={19} /></div>
      <motion.div className={styles.heroPhone} initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .8, delay: .15, ease: easing }}>
        <div className={styles.phoneFrame}>
          <div className={styles.phoneIsland} />
          <div className={styles.phoneTopbar}><span>9:41</span><span>● ●</span></div>
          <div className={styles.creatorAvatar}><Link2 aria-hidden="true" size={20} /></div>
          <strong>{t("workspace")}</strong>
          <p>{t("workspaceDescription")}</p>
          <div className={styles.phoneSocials}><SiYoutube size={15} /><SiInstagram size={15} /><SiTiktok size={14} /><SiDiscord size={15} /></div>
          <div className={styles.phoneLink}><span><Globe2 size={15} /></span><div><b>{t("destination")}</b><small>{t("destinationValue")}</small></div><ChevronRight size={15} /></div>
          <div className={styles.lockedPhoneLink}>
            <div className={styles.lockedTitle}><span><MousePointerClick size={15} /></span><div><b>{t("actionFlow")}</b><small>{t("actionFlowValue")}</small></div><Settings2 size={15} /></div>
            <div className={styles.phoneProgress}><span /></div>
            <div className={styles.phoneProgressLabel}><span>{t("linkStatus")}</span><b>{t("active")}</b></div>
          </div>
          <div className={styles.phoneBrand}><span className={styles.miniLogoMark} /> {t("madeWith")}</div>
        </div>
      </motion.div>
      <motion.div className={styles.clickBadge} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .55, delay: .65 }}>
        <span><TrendingUp size={16} /></span><div><small>{t("analytics")}</small><b>{t("analyticsValue")}</b></div>
      </motion.div>
    </div>
  );
}

export function HeroSection({ dashboardHref }: { dashboardHref: string | null }) {
  const t = useTranslations("Landing.hero");
  return (
    <section className={styles.hero} id="top">
      <div className={styles.container}>
        <div className={styles.heroGrid}>
          <motion.div className={styles.heroCopy} initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7, ease: easing }}>
            <span className={styles.eyebrow}>{t("eyebrow")}</span>
            <h1>{t("titleLine1")}<br /><span>{t("titleLine2")}</span></h1>
            <p>{t("description")}</p>
            <div className={styles.heroButtons}>
              <a className={styles.primaryButton} href={dashboardHref || "/register"}>{dashboardHref ? t("goToDashboard") : t("createPage")} <ArrowRight size={17} /></a>
              <a className={styles.secondaryButton} href="#link-flow"><Play size={15} fill="currentColor" /> {t("seeHow")}</a>
            </div>
            <div className={styles.microProof}>
              <span><CircleCheck size={15} /> {t("proof.quickSetup")}</span>
              <i aria-hidden="true" />
              <span>{t("proof.editAnytime")}</span>
              <i aria-hidden="true" />
              <span>{t("proof.clearTracking")}</span>
            </div>
          </motion.div>
          <HeroPhone />
        </div>
      </div>
    </section>
  );
}

const integrations = [
  { name: "YouTube", Icon: SiYoutube, color: "#ff0033" },
  { name: "TikTok", Icon: SiTiktok, color: "#69c9d0" },
  { name: "Instagram", Icon: SiInstagram, color: "#e4405f" },
  { name: "X", Icon: SiX, color: "#18181b" },
  { name: "Facebook", Icon: SiFacebook, color: "#1877f2" },
  { name: "LinkedIn", Icon: LinkedinIcon, color: "#0a66c2" },
  { name: "SoundCloud", Icon: SiSoundcloud, color: "#ff5500" },
  { name: "Spotify", Icon: SiSpotify, color: "#1db954" },
  { name: "Telegram", Icon: SiTelegram, color: "#26a5e4" },
  { name: "WhatsApp", Icon: SiWhatsapp, color: "#25d366" },
  { name: "Discord", Icon: SiDiscord, color: "#5865f2" },
  { name: "Twitch", Icon: SiTwitch, color: "#9146ff" },
  { name: "Behance", Icon: SiBehance, color: "#1769ff" },
  { name: "Dribbble", Icon: SiDribbble, color: "#ea4c89" },
  { name: "Reddit", Icon: SiReddit, color: "#ff4500" },
  { name: "Roblox", Icon: SiRoblox, color: "#e2231a" },
  { name: "Apple Music", Icon: SiApplemusic, color: "#fa243c" },
  { name: "Snapchat", Icon: SiSnapchat, color: "#fffc00" },
  { name: "Threads", Icon: SiThreads, color: "#18181b" },
  { name: "Bluesky", Icon: SiBluesky, color: "#0285ff" },
  { name: "Google Play", Icon: SiGoogleplay, color: "#34a853" },
  { name: "App Store", Icon: SiAppstore, color: "#0d96f6" },
] as const;

function PlatformLogoGroup({ duplicate = false }: { duplicate?: boolean }) {
  return (
    <div
      className={styles.platformMarqueeGroup}
      role={duplicate ? undefined : "list"}
      aria-hidden={duplicate || undefined}
    >
      {integrations.map(({ name, Icon, color }) => (
        <div
          className={styles.platformLogo}
          role={duplicate ? undefined : "listitem"}
          style={{ "--platform-color": color } as React.CSSProperties}
          key={name}
        >
          <Icon aria-hidden="true" />
          <span>{name}</span>
        </div>
      ))}
    </div>
  );
}

export function PlatformMarquee() {
  const t = useTranslations("Landing.platforms");
  return (
    <div
      className={styles.platformMarquee}
      role="region"
      aria-label={t("ariaLabel")}
    >
      <div className={styles.platformMarqueeTrack}>
        <PlatformLogoGroup />
        <PlatformLogoGroup duplicate />
      </div>
    </div>
  );
}

export function IntegrationStrip() {
  return (

    <section className={styles.integrationStrip} aria-labelledby="platform-proof-title">
      <div className={styles.container}>
        {/* <h2 id="platform-proof-title">
          Trusted by 92K+ <span>content creators</span> who gained <span>633M+</span> followers
        </h2> */}
        <PlatformMarquee />
      </div>
    </section>
  );
}

const reasons = [
  {
    key: "onePlace",
    icon: Link2,
  },
  {
    key: "meaningfulAction",
    icon: MousePointerClick,
  },
  {
    key: "clarity",
    icon: Settings2,
  },
  {
    key: "protected",
    icon: BarChart3,
  },
] as const;

export function WhyChooseUsSection() {
  const t = useTranslations("Landing.why");
  return (
    <section className={`${styles.section} ${styles.whySection}`} id="why-us">
      <div className={styles.container}>
        <Reveal className={`${styles.centerHeading} ${styles.whyHeading}`}>
          <span className={styles.eyebrow}>{t("eyebrow")}</span>
          <h2>{t("titleLine1")}<br />{t("titleLine2")}</h2>
          <p>{t("description")}</p>
        </Reveal>
        <div className={styles.whyShowcase}>
          {[reasons.slice(0, 2), reasons.slice(2)].map((group, groupIndex) => (
            <div className={`${styles.whySide} ${groupIndex === 0 ? styles.whySideLeft : styles.whySideRight}`} key={groupIndex}>
              {group.map((reason, index) => {
                const number = (groupIndex * 2) + index + 1;

                return (
                  <Reveal className={styles.whyPoint} key={reason.key}>
                    <div className={styles.whyPointTop}>
                      <span><reason.icon aria-hidden="true" size={20} /></span>
                      <small>0{number}</small>
                    </div>
                    <h3>{t(`reasons.${reason.key}.title`)}</h3>
                    <p>{t(`reasons.${reason.key}.body`)}</p>
                  </Reveal>
                );
              })}
            </div>
          ))}
          <Reveal className={styles.whyCore}>
            <span className={`${styles.whyOrbitChip} ${styles.whyOrbitOne}`}><Link2 size={18} /></span>
            <span className={`${styles.whyOrbitChip} ${styles.whyOrbitTwo}`}><MousePointerClick size={18} /></span>
            <span className={`${styles.whyOrbitChip} ${styles.whyOrbitThree}`}><Settings2 size={18} /></span>
            <span className={`${styles.whyOrbitChip} ${styles.whyOrbitFour}`}><BarChart3 size={18} /></span>
            <div className={styles.whyCorePanel}>
              <span><Sparkles aria-hidden="true" size={22} /></span>
              <small>{t("coreKicker")}</small>
              <strong>{t("coreTitleLine1")}<br />{t("coreTitleLine2")}</strong>
              <i>{t("coreMeta")}</i>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

const unlockActions = [
  { key: "youtube", icon: SiYoutube },
  { key: "x", icon: SiX },
  { key: "discord", icon: SiDiscord },
] as const;

export function UnlockDemoSection() {
  const t = useTranslations("Landing.unlock");
  const [completed, setCompleted] = useState([true, false, false]);
  const [revealed, setRevealed] = useState(false);
  const count = completed.filter(Boolean).length;
  const ready = count === completed.length;

  function toggleAction(index: number) {
    setRevealed(false);
    setCompleted((current) => current.map((value, i) => i === index ? !value : value));
  }

  return (
    <section className={styles.unlockSection} id="link-flow">
      <div className={`${styles.container} ${styles.unlockGrid}`}>
        <Reveal className={styles.darkCopy}>
          <span className={styles.eyebrow}>{t("eyebrow")}</span>
          <h2>{t("titleLine1")}<br />{t("titleLine2")}</h2>
          <p>{t("description")}</p>
          <div className={styles.metrics}>
            <div><strong>{t("destinationTypesValue")}</strong><span>{t("destinationTypes")}</span></div>
            <div><strong>{t("expiryControlsValue")}</strong><span>{t("expiryControls")}</span></div>
          </div>
        </Reveal>
        <Reveal>
          <div className={styles.unlockProduct} aria-live="polite">
            <div className={styles.unlockHeader}>
              <div><strong>{t("productTitle")}</strong><small>{t("productMeta")}</small></div>
            </div>

            <div className={styles.actionList}>
              {unlockActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <button key={action.key} onClick={() => toggleAction(index)} aria-pressed={completed[index]}>
                    <span className={styles.actionPlatform}><Icon size={18} /></span>
                    <span><b>{t(`actions.${action.key}.label`)}</b><small>{completed[index] ? t("completed") : t(`actions.${action.key}.note`)}</small></span>
                    <span className={completed[index] ? styles.actionComplete : styles.actionPending}>{completed[index] ? <Check size={15} /> : <ArrowRight size={15} />}</span>
                  </button>
                );
              })}
            </div>
            <div className={styles.unlockProgress}><motion.span animate={{ width: `${(count / 3) * 100}%` }} /></div>
            <div className={styles.unlockProgressText}>
              <span>{t("actionsCompleted", { count })}</span>
                          <span>{ count }/3</span>

            </div>
            <button className={styles.unlockCta} disabled={!ready} onClick={() => setRevealed(true)}>
              {revealed ? <><Check size={17} /> {t("contentRevealed")}</> : <><LockKeyhole size={16} /> {t("unlockContent")}</>}
            </button>
            <AnimatePresence>
              {revealed && (
                <motion.div className={styles.revealResult} initial={{ opacity: 0, height: 0, y: 8 }} animate={{ opacity: 1, height: "auto", y: 0 }} exit={{ opacity: 0, height: 0 }}>
                  <span><FileCheck2 size={18} /></span><div><b>{t("destinationReady")}</b><small>project-files.zip</small></div><Download size={17} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

const testimonialRows = [
  landingTestimonials.slice(0, 5),
  landingTestimonials.slice(5),
];

function TestimonialCard({ testimonial }: { testimonial: LandingTestimonial }) {
  const locale = useLocale() as AppLocale;
  const copy = testimonial.copy[locale] ?? testimonial.copy.vi;

  return (
    <article className={styles.testimonialCard}>
      <div className={styles.testimonialCardTop}>
        <span className={styles.quoteIcon}><Quote aria-hidden="true" size={19} /></span>
        <span className={styles.testimonialPlatform}>{testimonial.platform}</span>
      </div>
      <blockquote>“{copy.quote}”</blockquote>
      <div className={styles.testimonialPerson}>
        <span aria-hidden="true">{testimonial.initials}</span>
        <div><b>{testimonial.name}</b><small>{copy.role}</small></div>
      </div>
    </article>
  );
}

export function TestimonialsSection() {
  const t = useTranslations("Landing.testimonials");
  return (
    <section className={`${styles.section} ${styles.testimonialSection}`} id="features">
      <div className={styles.container}>
        <Reveal className={`${styles.centerHeading} ${styles.testimonialHeading}`}>
          <span className={styles.eyebrow}>{t("eyebrow")}</span>
          <h2>{t("title")}</h2>
          <p>{t("description")}</p>
        </Reveal>
        <div className={styles.testimonialMarquee}>
          {testimonialRows.map((row, rowIndex) => (
            <div className={styles.testimonialRow} key={rowIndex}>
              <div className={`${styles.testimonialTrack} ${rowIndex === 1 ? styles.testimonialTrackReverse : ""}`}>
                {[0, 1].map((copy) => (
                  <div aria-hidden={copy === 1 ? true : undefined} className={styles.testimonialGroup} key={copy}>
                    {row.map((testimonial) => (
                      <TestimonialCard
                        testimonial={testimonial}
                        key={`${copy}-${testimonial.id}`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const faqItems = [
  "create",
  "actions",
  "visitorAccount",
  "update",
  "analytics",
  "expiry",
] as const;

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const t = useTranslations("Landing.faq");

  return (
    <section className={`${styles.section} ${styles.faqSection}`} id="faqs">
      <div className={`${styles.container} ${styles.faqLayout}`}>
        <Reveal className={styles.faqIntro}>
          <span className={styles.eyebrow}>{t("eyebrow")}</span>
          <h2>{t("title")}</h2>
          <p>{t("description")}</p>
          <Link href="/register">{t("readyPrompt")} <span>{t("createAccount")}</span> <ArrowRight size={15} /></Link>
        </Reveal>
        <Reveal className={styles.faqList}>
          {faqItems.map((item, index) => {
            const isOpen = openIndex === index;
            const answerId = `faq-answer-${index}`;
            const question = t(`items.${item}.question`);

            return (
              <div className={`${styles.faqItem} ${isOpen ? styles.faqItemOpen : ""}`} key={item}>
                <h3>
                  <button
                    aria-controls={answerId}
                    aria-expanded={isOpen}
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    type="button"
                  >
                    <span>{question}</span>
                    <ChevronDown aria-hidden="true" size={20} />
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div
                      animate={{ height: "auto", opacity: 1 }}
                      className={styles.faqAnswer}
                      exit={{ height: 0, opacity: 0 }}
                      id={answerId}
                      initial={{ height: 0, opacity: 0 }}
                      role="region"
                      transition={{ duration: 0.24, ease: easing }}
                    >
                      <p>{t(`items.${item}.answer`)}</p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}

export function FinalCTA({ dashboardHref }: { dashboardHref: string | null }) {
  const t = useTranslations("Landing.cta");
  return (
    <section className={styles.finalSection} id="get-started">
      <Reveal className={styles.finalCta}>
        <div className={styles.finalCtaCopy}>
          <span className={styles.eyebrow}>{t("eyebrow")}</span>
          <h2>{t("title")}</h2>
          <p>{t("description")}</p>
          <div className={styles.ctaActions}>
            <a className={styles.primaryButton} href={dashboardHref || "/register"}>
              {dashboardHref ? t("goToDashboard") : t("start")} <ArrowRight size={17} />
            </a>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export function Footer({
  settings,
  menus,
  semantic = false,
  preferFallbackNavigation = false,
  fallbackAnchorPrefix = "",
}: {
  settings: PublicSiteSettings;
  menus?: Partial<Record<WebsiteMenuLocation, PublicMenu>>;
  semantic?: boolean;
  preferFallbackNavigation?: boolean;
  fallbackAnchorPrefix?: string;
}) {
  const t = useTranslations("Landing.footer");
  const managedColumns = menus?.["footer-primary"]?.items;
  const columns = !preferFallbackNavigation && managedColumns?.length
    ? managedColumns
    : [
        { id: -20, label: t("product"), children: [
          { id: -21, label: t("howItWorks"), href: `${fallbackAnchorPrefix}#link-flow`, target: "_self" as const, rel: null },
          { id: -22, label: t("pricing"), href: "/payout-rates", target: "_self" as const, rel: null },
          { id: -23, label: t("createLink"), href: "/member/create", target: "_self" as const, rel: null },
        ] },
        { id: -24, label: t("company"), children: [
          { id: -25, label: t("contact"), href: "/member/support", target: "_self" as const, rel: null },
          { id: -26, label: t("community"), href: "/register", target: "_self" as const, rel: null },
        ] },
      ];
  const managedLegalItems = menus?.["footer-legal"]?.items;
  const legalItems = !preferFallbackNavigation && managedLegalItems?.length
    ? managedLegalItems
    : [
        { id: -29, label: t("terms"), href: "/terms", target: "_self" as const, rel: null },
        { id: -30, label: t("privacy"), href: "/privacy", target: "_self" as const, rel: null },
        { id: -31, label: t("cookies"), href: "/cookies", target: "_self" as const, rel: null },
      ];
  const managedSocials = !preferFallbackNavigation
    ? (menus?.["footer-social"]?.items ?? []).flatMap((item) => {
        const platform = resolveFooterSocialPlatform(item.iconKey);
        return platform && item.href
          ? [{
              key: `menu-${item.id}`,
              platform,
              url: item.href,
              label: item.label,
              ariaLabel: item.ariaLabel,
              target: item.target,
              rel: item.rel,
            }]
          : [];
      })
    : [];
  const activeSocialLinks = settings.socialLinks.filter((link) => link.isActive);
  const footerSocials = managedSocials.length
    ? managedSocials
    : activeSocialLinks.length
      ? activeSocialLinks.map((link) => ({
          key: `settings-${link.platform}`,
          platform: link.platform,
          url: link.url,
          label: socialPlatformLabels[link.platform],
          ariaLabel: null,
          target: "_blank" as const,
          rel: "noreferrer",
        }))
      : fallbackFooterSocials.map((platform) => ({
          key: `fallback-${platform}`,
          platform,
          url: null,
          label: socialPlatformLabels[platform],
          ariaLabel: null,
          target: "_blank" as const,
          rel: "noreferrer",
        }));
  const footerDescription = t("description");
  return (
    <footer className={`${styles.footer} ${semantic ? styles.semanticFooter : ""}`}>
      <div className={`${styles.container} ${styles.footerGrid}`}>
        <div className={styles.footerBrand}>
          <Logo settings={settings} />
          <p>{footerDescription}</p>
          {settings.contact.email ? <a href={`mailto:${settings.contact.email}`}>{settings.contact.email}</a> : null}
          {settings.contact.phone ? <a href={`tel:${settings.contact.phone}`}>{settings.contact.phone}</a> : null}
          {settings.contact.address ? <p>{settings.contact.address}</p> : null}
          {settings.contact.workingHours ? <p>{settings.contact.workingHours}</p> : null}
          {settings.contact.mapUrl ? <a href={settings.contact.mapUrl} target="_blank" rel="noreferrer">{t("viewMap")}</a> : null}
          <div className={styles.footerSocials}>
            <div className={styles.footerSocialList}>
              {footerSocials.map((link) => {
                return link.url ? (
                  <a
                    aria-label={link.ariaLabel || t("socialLinkAria", { platform: link.label })}
                    className={styles.footerSocialButton}
                    href={link.url}
                    key={link.key}
                    rel={link.rel ?? undefined}
                    target={link.target}
                    title={link.label}
                  >
                    <FooterSocialIcon platform={link.platform} />
                  </a>
                ) : (
                  <span
                    aria-label={t("socialUnavailable", { platform: link.label })}
                    className={`${styles.footerSocialButton} ${styles.footerSocialButtonMuted}`}
                    key={link.key}
                    role="img"
                    title={t("socialUnavailable", { platform: link.label })}
                  >
                    <FooterSocialIcon platform={link.platform} />
                  </span>
                );
              })}
            </div>
          </div>
        </div>
        {columns.map((column) => (
          <div className={styles.footerColumn} key={column.id}>
            <strong>{column.label}</strong>
            {column.children.map((item) =>
              item.href ? (
                <a href={resolvePublicHref(item.href, fallbackAnchorPrefix)} key={item.id} target={item.target} rel={item.rel ?? undefined}>
                  {item.label}
                </a>
              ) : null,
            )}
          </div>
        ))}
        {legalItems.length ? (
          <div className={styles.footerColumn}>
            <strong>{(!preferFallbackNavigation && menus?.["footer-legal"]?.title) || t("legal")}</strong>
            {legalItems.map((item) =>
              item.href ? (
                <a href={resolvePublicHref(item.href, fallbackAnchorPrefix)} key={item.id} target={item.target} rel={item.rel ?? undefined}>
                  {item.label}
                </a>
              ) : null,
            )}
          </div>
        ) : null}
      </div>
      <div className={`${styles.container} ${styles.footerBottom}`}>
        <span>{t("rights", { year: 2026, site: settings.siteName })}</span>
        <LandingLanguageSwitcher />
      </div>
    </footer>
  );
}

export function LandingPage({
  settings,
  menus,
  dashboardHref,
}: {
  settings: PublicSiteSettings;
  menus?: Partial<Record<WebsiteMenuLocation, PublicMenu>>;
  dashboardHref: string | null;
}) {
  return (
    <main className={styles.page}>
      <Navbar dashboardHref={dashboardHref} menus={menus} preferFallbackNavigation semantic settings={settings} showThemeToggle />
      <HeroSection dashboardHref={dashboardHref} />
      <IntegrationStrip />
      <WhyChooseUsSection />
      <UnlockDemoSection />
      <TestimonialsSection />
      <FAQSection />
      <FinalCTA dashboardHref={dashboardHref} />
      <Footer menus={menus} semantic settings={settings} />
    </main>
  );
}
