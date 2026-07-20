"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronRight,
  CircleCheck,
  Clock3,
  Download,
  Eye,
  FileCheck2,
  FileText,
  Globe2,
  KeyRound,
  Link2,
  LockKeyhole,
  Menu,
  Play,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import {
  SiApplemusic,
  SiAppstore,
  SiBehance,
  SiBluesky,
  SiDiscord,
  SiDribbble,
  SiDropbox,
  SiFacebook,
  SiGoogleplay,
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
import { useState } from "react";
import Image from "next/image";
import styles from "@/app/page.module.css";
import type { PublicSiteSettings } from "@/features/site-settings/types";

const easing = [0.22, 1, 0.36, 1] as const;

function LinkedinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" focusable="false" {...props}>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.23 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
    </svg>
  );
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
  const lightLogo = settings.branding.logoLight;
  const darkLogo = settings.branding.logoDark;
  return (
    <a className={styles.logo} href="#top" aria-label={`${settings.siteName} home`}>
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

export function Navbar({ settings }: { settings: PublicSiteSettings }) {
  const [open, setOpen] = useState(false);
  const links = [
    ["How it works", "#how-it-works"],
    ["Features", "#features"],
    ["Creators", "#creators"],
    ["Pricing", "#pricing"],
  ];

  return (
    <header className={styles.navbar}>
      <nav className={styles.navInner} aria-label="Main navigation">
        <Logo settings={settings} />
        <div className={styles.navLinks}>
          {links.map(([label, href]) => <a key={label} href={href}>{label}</a>)}
        </div>
        <div className={styles.navActions}>
          <a className={styles.textButton} href="/login">Sign in</a>
          <a className={styles.smallPrimary} href="/register">Start creating <ArrowRight size={15} /></a>
        </div>
        <button className={styles.menuButton} onClick={() => setOpen(!open)} aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open}>
          {open ? <X size={21} /> : <Menu size={21} />}
        </button>
      </nav>
      <AnimatePresence>
        {open && (
          <motion.div className={styles.mobileMenu} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            {links.map(([label, href]) => <a key={label} href={href} onClick={() => setOpen(false)}>{label}</a>)}
            <a href="/login" onClick={() => setOpen(false)}>Sign in</a>
            <a className={styles.smallPrimary} href="/register">Start creating <ArrowRight size={15} /></a>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function HeroPhone() {
  return (
    <div className={styles.heroVisual} aria-label="Linkicom creator page preview">
      <div className={`${styles.platformFloat} ${styles.floatYoutube}`}><SiYoutube size={19} /></div>
      <div className={`${styles.platformFloat} ${styles.floatInstagram}`}><SiInstagram size={19} /></div>
      <div className={`${styles.platformFloat} ${styles.floatDiscord}`}><SiDiscord size={19} /></div>
      <motion.div className={styles.heroPhone} initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .8, delay: .15, ease: easing }}>
        <div className={styles.phoneFrame}>
          <div className={styles.phoneIsland} />
          <div className={styles.phoneTopbar}><span>9:41</span><span>● ●</span></div>
          <div className={styles.creatorAvatar}>AM</div>
          <strong>@alexmakes</strong>
          <p>Design systems, resources &amp; weekly notes.</p>
          <div className={styles.phoneSocials}><SiYoutube size={15} /><SiInstagram size={15} /><SiTiktok size={14} /><SiDiscord size={15} /></div>
          <div className={styles.phoneLink}><span><Link2 size={15} /></span><div><b>My design toolkit</b><small>42 curated resources</small></div><ChevronRight size={15} /></div>
          <div className={styles.lockedPhoneLink}>
            <div className={styles.lockedTitle}><span><Download size={15} /></span><div><b>Creator launch pack</b><small>PSD · FIG · PDF</small></div><LockKeyhole size={15} /></div>
            <div className={styles.phoneProgress}><span /></div>
            <div className={styles.phoneProgressLabel}><span>1 of 2 actions completed</span><b>50%</b></div>
          </div>
          <div className={styles.phoneBrand}><span className={styles.miniLogoMark} /> Made with Linkicom</div>
        </div>
      </motion.div>
      <motion.div className={styles.clickBadge} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .55, delay: .65 }}>
        <span><TrendingUp size={16} /></span><div><small>Clicks this week</small><b>+1,284</b></div>
      </motion.div>
    </div>
  );
}

export function HeroSection() {
  return (
    <section className={styles.hero} id="top">
      <div className={styles.container}>
        <div className={styles.heroGrid}>
          <motion.div className={styles.heroCopy} initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7, ease: easing }}>
            <span className={styles.eyebrow}>All-in-one creator link platform</span>
            <h1>One link.<br /><span>More momentum.</span></h1>
            <p>Turn every click into a follow, subscriber, fan, or customer with link-in-bio pages and verified unlock actions.</p>
            <div className={styles.heroButtons}>
              <a className={styles.primaryButton} href="/register">Create your free page <ArrowRight size={17} /></a>
              <a className={styles.secondaryButton} href="#unlock-demo"><Play size={15} fill="currentColor" /> See how it works</a>
            </div>
            <div className={styles.microProof}><CircleCheck size={15} /> No credit card required <i /> Launch in minutes</div>
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
  { name: "Dropbox", Icon: SiDropbox, color: "#0061ff" },
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
  return (
    <div
      className={styles.platformMarquee}
      role="region"
      aria-label="Supported social, creator, music, and app platforms"
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
        <h2 id="platform-proof-title">
          Trusted by 92K+ <span>content creators</span> who gained <span>633M+</span> followers
        </h2>
        <PlatformMarquee />
      </div>
    </section>
  );
}

const processSteps = [
  { number: "01", icon: Link2, title: "Add your destination", body: "Paste the content, download, invite, or offer you want to share.", visual: "linkicom.io/alex/launch-pack" },
  { number: "02", icon: UserCheck, title: "Choose required actions", body: "Ask visitors to subscribe, follow, join, or complete another action.", visual: "actions" },
  { number: "03", icon: TrendingUp, title: "Publish and grow", body: "Share one link and monitor visits, actions, unlocks, and conversion.", visual: "growth" },
];

function StepVisual({ type }: { type: string }) {
  if (type === "actions") return <div className={styles.stepActions}><span><SiYoutube size={17} /></span><i /><span><SiDiscord size={17} /></span><i /><span><Check size={16} /></span></div>;
  if (type === "growth") return <div className={styles.stepGrowth}><BarChart3 size={18} /><span><i style={{ height: "38%" }} /><i style={{ height: "56%" }} /><i style={{ height: "74%" }} /><i style={{ height: "100%" }} /></span><b>+38%</b></div>;
  return <div className={styles.stepLink}><Globe2 size={16} /><span>{type}</span><Check size={15} /></div>;
}

export function ProcessTimeline() {
  return (
    <section className={styles.section} id="how-it-works">
      <div className={styles.container}>
        <Reveal className={styles.centerHeading}>
          <span className={styles.eyebrow}>Simple by design</span>
          <h2>From idea to shared in three easy steps.</h2>
          <p>No code. No clutter. Just a better path from your content to your community.</p>
        </Reveal>
        <div className={styles.timeline}>
          {processSteps.map((step) => (
            <article className={styles.timelineStep} key={step.number}>
              <div className={styles.timelineMarker}><span>{step.number}</span></div>
              <StepVisual type={step.visual} />
              <div className={styles.timelineTitle}><step.icon size={18} /><h3>{step.title}</h3></div>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const unlockActions = [
  { label: "Subscribe on YouTube", note: "Verify subscription", icon: SiYoutube },
  { label: "Follow on X", note: "Verify follow", icon: SiX },
  { label: "Join Discord", note: "Verify membership", icon: SiDiscord },
];

export function UnlockDemoSection() {
  const [completed, setCompleted] = useState([true, false, false]);
  const [revealed, setRevealed] = useState(false);
  const count = completed.filter(Boolean).length;
  const ready = count === completed.length;

  function toggleAction(index: number) {
    setRevealed(false);
    setCompleted((current) => current.map((value, i) => i === index ? !value : value));
  }

  return (
    <section className={styles.unlockSection} id="unlock-demo">
      <div className={`${styles.container} ${styles.unlockGrid}`}>
        <Reveal className={styles.darkCopy}>
          <span className={styles.eyebrow}>Verified engagement</span>
          <h2>One tiny action.<br />One rewarding reveal.</h2>
          <p>Turn passive visitors into real subscribers and community members before revealing your content.</p>
          <div className={styles.metrics}>
            <div><strong>36%</strong><span>average unlock conversion</span></div>
            <div><strong>2.4×</strong><span>more qualified engagement</span></div>
          </div>
        </Reveal>
        <Reveal>
          <div className={styles.unlockProduct} aria-live="polite">
            <div className={styles.unlockHeader}>
              <span><FileText size={21} /></span>
              <div><strong>Creator launch checklist</strong><small>PDF guide · 2.8 MB</small></div>
              <em>FREE</em>
            </div>
            <div className={styles.unlockProgress}><motion.span animate={{ width: `${(count / 3) * 100}%` }} /></div>
            <div className={styles.unlockProgressText}><span>{count} of 3 actions completed</span><b>{Math.round((count / 3) * 100)}%</b></div>
            <div className={styles.actionList}>
              {unlockActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <button key={action.label} onClick={() => toggleAction(index)} aria-pressed={completed[index]}>
                    <span className={styles.actionPlatform}><Icon size={18} /></span>
                    <span><b>{action.label}</b><small>{completed[index] ? "Completed and verified" : action.note}</small></span>
                    <span className={completed[index] ? styles.actionComplete : styles.actionPending}>{completed[index] ? <Check size={15} /> : <ArrowRight size={15} />}</span>
                  </button>
                );
              })}
            </div>
            <button className={styles.unlockCta} disabled={!ready} onClick={() => setRevealed(true)}>
              {revealed ? <><Check size={17} /> Content revealed</> : <><LockKeyhole size={16} /> Unlock content</>}
            </button>
            <AnimatePresence>
              {revealed && (
                <motion.div className={styles.revealResult} initial={{ opacity: 0, height: 0, y: 8 }} animate={{ opacity: 1, height: "auto", y: 0 }} exit={{ opacity: 0, height: 0 }}>
                  <span><FileCheck2 size={18} /></span><div><b>Your download is ready</b><small>creator-launch-checklist.pdf</small></div><Download size={17} />
                </motion.div>
              )}
            </AnimatePresence>
            <div className={styles.secureNote}><ShieldCheck size={14} /> Actions are checked before content is revealed</div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

type FeatureKey = "bio" | "unlock" | "analytics" | "themes" | "protected";
const features: Array<{ key: FeatureKey; label: string; title: string; body: string }> = [
  { key: "bio", label: "Link-in-bio", title: "One home for everything you create", body: "Bring your links, social profiles, newest release and gated resources into a focused creator page." },
  { key: "unlock", label: "Unlock actions", title: "Ask for meaningful action, not empty attention", body: "Stack social requirements, confirm completion and reveal content in one clean visitor flow." },
  { key: "analytics", label: "Analytics", title: "Know exactly what turns visits into growth", body: "Understand clicks, completed actions, unlock rate and your highest-performing links." },
  { key: "themes", label: "Custom themes", title: "Make every page feel unmistakably yours", body: "Adjust colors, typography, cover media and layout with a fast live preview." },
  { key: "protected", label: "Protected content", title: "Share valuable content with sensible controls", body: "Set access rules, expiration and content reveal behavior without exposing the destination early." },
];

function BrowserShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={styles.browserShell}>
      <div className={styles.browserBar}><span><i /><i /><i /></span><div><LockKeyhole size={11} /> app.linkicom.io/{title}</div><span /></div>
      <div className={styles.browserBody}>{children}</div>
    </div>
  );
}

function BioPreview() {
  return <BrowserShell title="page-editor"><div className={styles.editorLayout}><aside><span className={styles.logo}>Linkicom</span><span className={styles.editorActive}>Page</span><span>Links</span><span>Appearance</span><span>Settings</span></aside><main><div className={styles.editorHeader}><div><small>PAGE EDITOR</small><b>Creator page</b></div><button>Publish changes</button></div><div className={styles.editorForm}><label>Profile title<span>Alex Makes</span></label><label>Bio<span>Design systems, resources &amp; weekly notes.</span></label><div className={styles.editorLinkRow}><span><Link2 size={16} /></span><div><b>My design toolkit</b><small>linkicom.io/alex/toolkit</small></div><Eye size={16} /></div><div className={styles.editorLinkRow}><span><LockKeyhole size={16} /></span><div><b>Creator launch pack</b><small>2 unlock actions</small></div><Eye size={16} /></div></div></main><div className={styles.editorPhone}><div className={styles.previewAvatar}>AM</div><b>@alexmakes</b><p>Design systems &amp; weekly notes</p><span>My design toolkit</span><span>Creator launch pack <LockKeyhole size={12} /></span></div></div></BrowserShell>;
}

function UnlockPreview() {
  return <BrowserShell title="unlock-builder"><div className={styles.builderPreview}><div className={styles.builderHead}><div><small>UNLOCK FLOW</small><b>Creator launch pack</b></div><button>Save flow</button></div><div className={styles.builderColumns}><div><strong>Required actions</strong><div className={styles.builderAction}><SiYoutube size={18} /><span><b>Subscribe</b><small>youtube.com/@alexmakes</small></span><CircleCheck size={16} /></div><div className={styles.builderAction}><SiDiscord size={18} /><span><b>Join server</b><small>discord.gg/creators</small></span><CircleCheck size={16} /></div><button className={styles.addAction}>+ Add action</button></div><div className={styles.verificationPane}><span><ShieldCheck size={22} /></span><b>Verification enabled</b><p>Each requirement is checked before the destination is revealed.</p><div><Check size={14} /> Destination protected</div><div><Check size={14} /> Duplicate checks on</div></div></div></div></BrowserShell>;
}

function AnalyticsPreview() {
  return <BrowserShell title="analytics"><div className={styles.analyticsPreview}><div className={styles.analyticsHead}><div><small>ANALYTICS</small><b>Performance overview</b></div><span>Last 30 days⌄</span></div><div className={styles.analyticsKpis}><div><small>Page views</small><b>28,410</b><em>+18.2%</em></div><div><small>Verified actions</small><b>10,824</b><em>+12.7%</em></div><div><small>Conversion</small><b>38.1%</b><em>+4.2%</em></div></div><div className={styles.lineChart}><span>12k</span><svg viewBox="0 0 600 160" preserveAspectRatio="none" aria-hidden="true"><path d="M0 138 C55 130 66 95 119 108 S185 126 230 82 S299 100 345 62 S410 74 458 42 S535 53 600 18" /><path className={styles.chartArea} d="M0 138 C55 130 66 95 119 108 S185 126 230 82 S299 100 345 62 S410 74 458 42 S535 53 600 18 L600 160 L0 160 Z" /></svg><span>0</span></div><div className={styles.chartLegend}><i /> Views <i /> Verified actions</div></div></BrowserShell>;
}

function ThemesPreview() {
  return <BrowserShell title="appearance"><div className={styles.themePreview}><div className={styles.themeControls}><small>APPEARANCE</small><h4>Build your theme</h4><label>Brand color</label><div className={styles.swatches}><i /><i /><i /><i /><i /></div><label>Typography</label><button>Geist <span>⌄</span></button><label>Button style</label><div className={styles.buttonStyles}><i /><i /><i /></div></div><div className={styles.themeCanvas}><div><span className={styles.previewAvatar}>AM</span><b>Alex Makes</b><p>Design systems &amp; weekly notes</p><em>My design toolkit <ArrowRight size={13} /></em><em>Creator launch pack <LockKeyhole size={12} /></em></div></div></div></BrowserShell>;
}

function ProtectedPreview() {
  return <BrowserShell title="content-rules"><div className={styles.protectedPreview}><div className={styles.protectedHead}><span><ShieldCheck size={26} /></span><div><small>CONTENT STATUS</small><b>Protected and ready</b></div><em>ACTIVE</em></div><div className={styles.ruleRows}><div><span><KeyRound size={17} /></span><div><b>Access rules</b><small>All 3 actions must be verified</small></div><ChevronRight size={17} /></div><div><span><Clock3 size={17} /></span><div><b>Expiration</b><small>Link expires in 14 days</small></div><ChevronRight size={17} /></div><div><span><ShieldCheck size={17} /></span><div><b>Duplicate protection</b><small>Limit one unlock per visitor</small></div><ChevronRight size={17} /></div></div><div className={styles.securitySummary}><Check size={16} /> Destination URL is hidden until verification completes</div></div></BrowserShell>;
}

function FeaturePreview({ feature }: { feature: FeatureKey }) {
  return <AnimatePresence mode="wait"><motion.div key={feature} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: .28 }}>{feature === "bio" ? <BioPreview /> : feature === "unlock" ? <UnlockPreview /> : feature === "analytics" ? <AnalyticsPreview /> : feature === "themes" ? <ThemesPreview /> : <ProtectedPreview />}</motion.div></AnimatePresence>;
}

export function FeatureShowcase() {
  const [active, setActive] = useState<FeatureKey>("bio");
  return (
    <section className={`${styles.section} ${styles.featureSection}`} id="features">
      <div className={styles.container}>
        <Reveal className={styles.leftHeading}><span className={styles.eyebrow}>Built for real workflows</span><h2>Small toolkit.<br />Big creator energy.</h2></Reveal>
        <div className={styles.featureLayout}>
          <div className={styles.featureNav} role="tablist" aria-label="Product features">
            {features.map((feature) => (
              <button key={feature.key} role="tab" id={`feature-${feature.key}`} aria-selected={active === feature.key} aria-controls="feature-preview" onClick={() => setActive(feature.key)} className={active === feature.key ? styles.activeFeature : ""}>
                <span>{feature.label}</span>
                {active === feature.key && <motion.div layoutId="feature-copy"><h3>{feature.title}</h3><p>{feature.body}</p></motion.div>}
              </button>
            ))}
          </div>
          <div className={styles.featurePreview} id="feature-preview" role="tabpanel" aria-labelledby={`feature-${active}`}><FeaturePreview feature={active} /></div>
        </div>
      </div>
    </section>
  );
}

export function SocialProofSection() {
  return (
    <section className={styles.proofSection}>
      <div className={`${styles.container} ${styles.proofGrid}`}>
        <Reveal className={styles.quoteBlock}>
          <span className={styles.eyebrow}>Creator proof</span>
          <blockquote>“Linkicom helped us turn free downloads into an audience we can actually reach.”</blockquote>
          <div className={styles.quotePerson}><span>NP</span><div><b>Nina Park</b><small>Video creator · Prototype testimonial</small></div></div>
        </Reveal>
        <Reveal>
          <div className={styles.proofAnalytics}>
            <div className={styles.proofAnalyticsHead}><div><small>PROTOTYPE SNAPSHOT</small><b>Audience growth</b></div><span>Last 30 days</span></div>
            <div className={styles.proofNumbers}><div><small>Page views</small><b>28.4K</b></div><div><small>Verified actions</small><b>10.8K</b></div><div><small>Conversion</small><b>38.1%</b></div></div>
            <div className={styles.proofChart}><svg viewBox="0 0 520 130" preserveAspectRatio="none" aria-label="Prototype audience growth line chart"><path d="M0 112 C40 104 69 114 102 91 S160 99 194 70 S250 88 292 52 S357 66 400 36 S468 49 520 15" /></svg></div>
            <div className={styles.funnel}><span style={{ width: "100%" }}>28.4K visits</span><span style={{ width: "68%" }}>19.2K action starts</span><span style={{ width: "38.1%" }}>10.8K verified</span></div>
            <p>Placeholder metrics for prototype presentation only. Connect real analytics before production use.</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

const useCases = [
  { key: "video", label: "Video creators", title: "Turn every download into a subscriber.", body: "Offer presets, project files and bonus content in exchange for a verified YouTube action.", steps: ["YouTube subscribe", "Verify action", "Reveal download"] },
  { key: "community", label: "Community builders", title: "Grow Discord and private communities from one page.", body: "Move fans from social feeds into an owned community with a simple verified membership flow.", steps: ["Join Discord", "Verify membership", "Reveal invite or bonus"] },
  { key: "seller", label: "Digital sellers", title: "Deliver protected files and exclusive offers.", body: "Add a lightweight action layer before valuable resources, launch assets and exclusive offers.", steps: ["Complete action", "Verify", "Reveal product or resource"] },
];

function UseCasePreview({ active }: { active: string }) {
  const isCommunity = active === "community";
  const isSeller = active === "seller";
  return (
    <AnimatePresence mode="wait"><motion.div key={active} className={styles.useCasePreview} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
      <div className={styles.useCasePreviewHead}><span>{isCommunity ? <Users size={20} /> : isSeller ? <FileText size={20} /> : <Play size={20} />}</span><div><small>LIVE WORKFLOW</small><b>{isCommunity ? "Community starter pack" : isSeller ? "Exclusive resource bundle" : "Cinematic preset pack"}</b></div><em>ACTIVE</em></div>
      <div className={styles.workflowPreview}>
        <div className={styles.workflowCreator}><span>{isCommunity ? <SiDiscord size={21} /> : isSeller ? <FileText size={21} /> : <SiYoutube size={21} />}</span><div><b>{isCommunity ? "Join the creator server" : isSeller ? "Access the resource" : "Subscribe to Alex Makes"}</b><small>{isCommunity ? "discord.gg/alexmakes" : isSeller ? "Protected content" : "youtube.com/@alexmakes"}</small></div><CircleCheck size={18} /></div>
        <div className={styles.verifyRow}><span /><ShieldCheck size={18} /><span /></div>
        <div className={styles.revealBox}><LockKeyhole size={19} /><div><b>{isCommunity ? "Private invite + bonus" : isSeller ? "Product files + license" : "12 cinematic presets"}</b><small>Reveal after verification</small></div><Download size={17} /></div>
      </div>
    </motion.div></AnimatePresence>
  );
}

export function UseCaseTabs() {
  const [active, setActive] = useState("video");
  const current = useCases.find((item) => item.key === active)!;
  return (
    <section className={styles.section} id="creators">
      <div className={styles.container}>
        <Reveal className={styles.centerHeading}><span className={styles.eyebrow}>Creator-first by default</span><h2>Built for the way creators grow.</h2></Reveal>
        <div className={styles.useCaseTabs} role="tablist" aria-label="Creator use cases">
          {useCases.map((item) => <button key={item.key} role="tab" aria-selected={active === item.key} aria-controls="use-case-panel" onClick={() => setActive(item.key)} className={active === item.key ? styles.activeUseCase : ""}>{item.label}</button>)}
        </div>
        <div className={styles.useCaseLayout} id="use-case-panel" role="tabpanel">
          <div className={styles.useCaseCopy}><h3>{current.title}</h3><p>{current.body}</p><div className={styles.workflowLine}>{current.steps.map((step, index) => <div key={step}><span>{index + 1}</span><b>{step}</b>{index < current.steps.length - 1 && <ArrowRight size={16} />}</div>)}</div><a href="/register">Build this workflow <ArrowRight size={16} /></a></div>
          <UseCasePreview active={active} />
        </div>
      </div>
    </section>
  );
}

export function FinalCTA() {
  return (
    <section className={styles.finalSection} id="pricing">
      <Reveal className={styles.finalCta}>
        <div className={`${styles.ctaIcon} ${styles.ctaIconOne}`}><SiYoutube size={18} /></div>
        <div className={`${styles.ctaIcon} ${styles.ctaIconTwo}`}><SiDiscord size={18} /></div>
        <div className={`${styles.ctaIcon} ${styles.ctaIconThree}`}><Sparkles size={18} /></div>
        <h2>Your next big click<br />starts right here.</h2>
        <p>Build a page your audience remembers and a growth loop that keeps working.</p>
        <a className={styles.primaryButton} href="/register">Start creating for free <ArrowRight size={17} /></a>
        <small>No credit card required <i /> Free plan available</small>
      </Reveal>
    </section>
  );
}

export function Footer({ settings }: { settings: PublicSiteSettings }) {
  const columns = [
    ["Product", "Features", "Creator pages", "Unlock actions", "Analytics"],
    ["Resources", "Help center", "Creator guide", "Examples", "Status"],
    ["Company", "About", "Contact", "Careers", "Brand"],
    ["Legal", "Privacy", "Terms", "Acceptable use", "Cookies"],
  ];
  return (
    <footer className={styles.footer}>
      <div className={`${styles.container} ${styles.footerGrid}`}>
        <div className={styles.footerBrand}>
          <Logo settings={settings} />
          <p>{settings.siteDescription || settings.siteTagline}</p>
          {settings.contact.email ? <a href={`mailto:${settings.contact.email}`}>{settings.contact.email}</a> : null}
          {settings.contact.phone ? <a href={`tel:${settings.contact.phone}`}>{settings.contact.phone}</a> : null}
          {settings.contact.address ? <p>{settings.contact.address}</p> : null}
          {settings.contact.workingHours ? <p>{settings.contact.workingHours}</p> : null}
          {settings.contact.mapUrl ? <a href={settings.contact.mapUrl} target="_blank" rel="noreferrer">View map</a> : null}
          {settings.socialLinks.length ? (
            <div className="mt-3 flex flex-wrap gap-3">
              {settings.socialLinks.map((link) => (
                <a key={link.platform} href={link.url} target="_blank" rel="noreferrer">
                  {link.platform}
                </a>
              ))}
            </div>
          ) : null}
        </div>
        {columns.map(([title, ...links]) => <div className={styles.footerColumn} key={title}><strong>{title}</strong>{links.map((link) => <a href="#top" key={link}>{link}</a>)}</div>)}
      </div>
      <div className={`${styles.container} ${styles.footerBottom}`}><span>© 2026 {settings.siteName}. All rights reserved.</span><span>{settings.siteTagline || "Built for creators, from first click to real connection."}</span></div>
    </footer>
  );
}

export function LandingPage({ settings }: { settings: PublicSiteSettings }) {
  return (
    <main className={styles.page}>
      <Navbar settings={settings} />
      <HeroSection />
      <IntegrationStrip />
      <ProcessTimeline />
      <UnlockDemoSection />
      <FeatureShowcase />
      <SocialProofSection />
      <UseCaseTabs />
      <FinalCTA />
      <Footer settings={settings} />
    </main>
  );
}
