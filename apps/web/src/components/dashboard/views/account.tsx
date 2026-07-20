"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Bell,
  Camera,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Copy,
  CreditCard,
  ExternalLink,
  Eye,
  EyeOff,
  Globe2,
  KeyRound,
  Link2,
  Mail,
  MessageSquare,
  Save,
  ShieldCheck,
  Smartphone,
  User,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { PageHeader } from "@/components/dashboard/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { MemberPaymentMethodsManager } from "@/features/payment-methods/components/member-payment-methods-page";

type ProfileForm = {
  firstName: string;
  lastName: string;
  email: string;
  bio: string;
};

type PasswordForm = {
  current: string;
  next: string;
  confirm: string;
};

type NotificationKey = "account" | "activity" | "revenue" | "product" | "push";

const inputClassName = "h-11 rounded-lg border-border bg-background shadow-none sm:h-10";

export function AccountView() {
  const t = useTranslations("Account");
  const { data: session } = useSession();
  const hydratedProfile = useRef(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [profile, setProfile] = useState<ProfileForm>({
    firstName: "",
    lastName: "",
    email: "",
    bio: t("profile.bioValue"),
  });
  const [currency, setCurrency] = useState("VND");
  const [notifications, setNotifications] = useState<Record<NotificationKey, boolean>>({
    account: true,
    activity: true,
    revenue: true,
    product: false,
    push: false,
  });
  const [customDomain, setCustomDomain] = useState("");
  const [domainStatus, setDomainStatus] = useState<"idle" | "pending">("idle");
  const [password, setPassword] = useState<PasswordForm>({ current: "", next: "", confirm: "" });
  const [showPasswords, setShowPasswords] = useState(false);

  useEffect(() => {
    if (!session?.user || hydratedProfile.current) return;

    const nameParts = (session.user.name || "").trim().split(/\s+/).filter(Boolean);
    const firstName = nameParts.pop() || "";
    hydratedProfile.current = true;
    setProfile((current) => ({
      ...current,
      firstName,
      lastName: nameParts.join(" "),
      email: session.user?.email || "",
    }));
  }, [session]);

  const displayName = [profile.lastName, profile.firstName].filter(Boolean).join(" ") || t("profile.fallbackName");
  const initials = useMemo(
    () => displayName.split(/\s+/).filter(Boolean).slice(-2).map((part) => part[0]?.toUpperCase()).join("") || "LI",
    [displayName],
  );
  const referralLink = useMemo(
    () => `https://linkicom.io/ref/${session?.user?.id?.slice(0, 8) || "creator"}`,
    [session?.user?.id],
  );
  const passwordIsLongEnough = password.next.length >= 8;
  const passwordHasNumber = /\d/.test(password.next);
  const passwordsMatch = Boolean(password.next) && password.next === password.confirm;
  const canUpdatePassword = Boolean(password.current) && passwordIsLongEnough && passwordHasNumber && passwordsMatch;

  const sections: Array<{ id: string; icon: LucideIcon; label: string }> = [
    { id: "personal-information", icon: User, label: t("navigation.personal") },
    { id: "payment-method", icon: CreditCard, label: t("navigation.payment") },
    { id: "currency", icon: CircleDollarSign, label: t("navigation.currency") },
    { id: "notifications", icon: Bell, label: t("navigation.notifications") },
    { id: "custom-domain", icon: Globe2, label: t("navigation.domain") },
    { id: "change-password", icon: KeyRound, label: t("navigation.password") },
    { id: "referral-link", icon: Link2, label: t("navigation.referral") },
  ];

  const notifySaved = (section: string) => toast.success(t("toast.sectionSaved", { section }));

  const copyText = async (value: string, message: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(message);
    } catch {
      toast.error(t("toast.copyFailed"));
    }
  };

  const handleAvatarChange = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("profile.avatarInvalid"));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(typeof reader.result === "string" ? reader.result : "");
    reader.readAsDataURL(file);
  };

  const handlePasswordSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canUpdatePassword) return;
    toast.success(t("security.passwordUpdated"));
    setPassword({ current: "", next: "", confirm: "" });
  };

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-6">
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
        action={
          <Badge variant="secondary" className="h-8 gap-1.5 border border-border bg-muted/50 px-2.5 text-foreground">
            <CheckCircle2 className="text-primary" />
            {t("verified")}
          </Badge>
        }
      />

      <div className="rounded-xl border border-border bg-card px-4 py-3 sm:px-5">
        <p className="flex items-start gap-2 text-sm leading-6 text-muted-foreground">
          <ShieldCheck className="mt-1 size-4 shrink-0 text-primary" />
          {t("context")}
        </p>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[230px_minmax(0,1fr)]">
        <nav
          aria-label={t("navigation.label")}
          className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-2 lg:sticky lg:top-[calc(var(--header-height)+1.5rem)] lg:flex-col"
        >
          {sections.map(({ id, icon: Icon, label }) => (
            <a
              key={id}
              href={`#${id}`}
              className="flex min-h-10 shrink-0 items-center gap-2.5 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <Icon className="size-4" />
              {label}
            </a>
          ))}
        </nav>

        <main className="min-w-0 space-y-5">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              notifySaved(t("profile.title"));
            }}
          >
            <SettingsCard
              id="personal-information"
              icon={User}
              title={t("profile.title")}
              description={t("profile.description")}
            >
              <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center">
                <Avatar className="size-16 border border-border sm:size-20">
                  <AvatarImage src={avatarPreview || session?.user?.image || undefined} alt={displayName} />
                  <AvatarFallback className="text-base font-semibold sm:text-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{t("profile.avatarHint")}</p>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(event) => handleAvatarChange(event.target.files?.[0])}
                  />
                  <Button type="button" variant="outline" size="sm" className="mt-3 h-9" onClick={() => avatarInputRef.current?.click()}>
                    <Camera />
                    {t("profile.changeAvatar")}
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 pt-5 sm:grid-cols-2">
                <FieldBlock label={t("profile.lastName")} htmlFor="account-last-name">
                  <Input
                    id="account-last-name"
                    value={profile.lastName}
                    onChange={(event) => setProfile((current) => ({ ...current, lastName: event.target.value }))}
                    className={inputClassName}
                  />
                </FieldBlock>
                <FieldBlock label={t("profile.firstName")} htmlFor="account-first-name">
                  <Input
                    id="account-first-name"
                    value={profile.firstName}
                    onChange={(event) => setProfile((current) => ({ ...current, firstName: event.target.value }))}
                    className={inputClassName}
                  />
                </FieldBlock>
                <FieldBlock label={t("profile.email")} htmlFor="account-email" className="sm:col-span-2">
                  <div className="relative">
                    <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="account-email"
                      type="email"
                      value={profile.email}
                      onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))}
                      className={`${inputClassName} pl-9 pr-24`}
                    />
                    <Badge variant="secondary" className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 border border-border bg-muted/60">
                      {t("verified")}
                    </Badge>
                  </div>
                </FieldBlock>
                <FieldBlock label={t("profile.bio")} htmlFor="account-bio" className="sm:col-span-2">
                  <Textarea
                    id="account-bio"
                    value={profile.bio}
                    onChange={(event) => setProfile((current) => ({ ...current, bio: event.target.value.slice(0, 180) }))}
                    className="min-h-24 resize-y rounded-lg border-border bg-background shadow-none"
                  />
                  <p className="text-right text-xs tabular-nums text-muted-foreground">{profile.bio.length}/180</p>
                </FieldBlock>
              </div>

              <CardActions>
                <Button type="submit" className="h-10"><Save />{t("saveChanges")}</Button>
              </CardActions>
            </SettingsCard>
          </form>

          <SettingsCard
            id="payment-method"
            icon={CreditCard}
            title={t("payment.title")}
            description={t("payment.description")}
          >
            <MemberPaymentMethodsManager />
          </SettingsCard>

          <SettingsCard
            id="currency"
            icon={CircleDollarSign}
            title={t("currency.title")}
            description={t("currency.description")}
          >
            <div className="grid items-end gap-4 md:grid-cols-[minmax(0,1fr)_minmax(240px,0.7fr)]">
              <FieldBlock label={t("currency.label")} htmlFor="account-currency">
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger id="account-currency" className={`${inputClassName} w-full`}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VND">VND — Vietnamese đồng</SelectItem>
                    <SelectItem value="USD">USD — US dollar</SelectItem>
                    <SelectItem value="EUR">EUR — Euro</SelectItem>
                  </SelectContent>
                </Select>
              </FieldBlock>
              <div className="rounded-lg border border-border bg-muted/20 px-4 py-3">
                <p className="text-xs text-muted-foreground">{t("currency.preview")}</p>
                <p className="mt-1 font-mono text-sm font-medium text-foreground">
                  {currency === "VND" ? "1.250.000 ₫" : currency === "USD" ? "$48.10" : "€41.50"}
                </p>
              </div>
            </div>
            <p className="mt-4 text-xs leading-5 text-muted-foreground">{t("currency.hint")}</p>
            <CardActions>
              <Button type="button" className="h-10" onClick={() => notifySaved(t("currency.title"))}><Save />{t("saveChanges")}</Button>
            </CardActions>
          </SettingsCard>

          <SettingsCard
            id="notifications"
            icon={Bell}
            title={t("notifications.title")}
            description={t("notifications.description")}
          >
            <div className="divide-y divide-border">
              <NotificationRow
                id="notification-account"
                icon={ShieldCheck}
                title={t("notifications.accountTitle")}
                description={t("notifications.accountDescription")}
                checked={notifications.account}
                onCheckedChange={(checked) => setNotifications((current) => ({ ...current, account: checked }))}
              />
              <NotificationRow
                id="notification-activity"
                icon={Link2}
                title={t("notifications.activityTitle")}
                description={t("notifications.activityDescription")}
                checked={notifications.activity}
                onCheckedChange={(checked) => setNotifications((current) => ({ ...current, activity: checked }))}
              />
              <NotificationRow
                id="notification-revenue"
                icon={CircleDollarSign}
                title={t("notifications.revenueTitle")}
                description={t("notifications.revenueDescription")}
                checked={notifications.revenue}
                onCheckedChange={(checked) => setNotifications((current) => ({ ...current, revenue: checked }))}
              />
              <NotificationRow
                id="notification-product"
                icon={MessageSquare}
                title={t("notifications.productTitle")}
                description={t("notifications.productDescription")}
                checked={notifications.product}
                onCheckedChange={(checked) => setNotifications((current) => ({ ...current, product: checked }))}
              />
              <NotificationRow
                id="notification-push"
                icon={Smartphone}
                title={t("notifications.pushTitle")}
                description={t("notifications.pushDescription")}
                checked={notifications.push}
                onCheckedChange={(checked) => setNotifications((current) => ({ ...current, push: checked }))}
              />
            </div>
            <CardActions>
              <Button type="button" className="h-10" onClick={() => notifySaved(t("notifications.title"))}><Save />{t("saveChanges")}</Button>
            </CardActions>
          </SettingsCard>

          <SettingsCard
            id="custom-domain"
            icon={Globe2}
            title={t("domain.title")}
            description={t("domain.description")}
            status={<Badge variant={domainStatus === "pending" ? "secondary" : "outline"}>{t(`domain.status.${domainStatus}`)}</Badge>}
          >
            <FieldBlock label={t("domain.label")} htmlFor="custom-domain-input">
              <InputGroup className="h-11 rounded-lg bg-background shadow-none sm:h-10">
                <InputGroupAddon><InputGroupText>https://</InputGroupText></InputGroupAddon>
                <InputGroupInput
                  id="custom-domain-input"
                  value={customDomain}
                  onChange={(event) => {
                    setCustomDomain(event.target.value.replace(/^https?:\/\//, ""));
                    setDomainStatus("idle");
                  }}
                  placeholder="links.example.com"
                />
              </InputGroup>
            </FieldBlock>

            <div className="mt-5 rounded-lg border border-border bg-muted/20 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{t("domain.dnsTitle")}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{t("domain.dnsDescription")}</p>
                </div>
                <Badge variant="outline" className="font-mono">CNAME</Badge>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <DnsValue label={t("domain.host")} value="links" />
                <DnsValue
                  label={t("domain.value")}
                  value="domains.linkicom.io"
                  onCopy={() => void copyText("domains.linkicom.io", t("domain.copied"))}
                />
              </div>
            </div>

            <CardActions>
              <p className="text-xs leading-5 text-muted-foreground">{t("domain.hint")}</p>
              <Button
                type="button"
                className="h-10"
                disabled={!customDomain.trim()}
                onClick={() => {
                  setDomainStatus("pending");
                  toast.success(t("domain.checking"));
                }}
              >
                <Globe2 />
                {t("domain.connect")}
              </Button>
            </CardActions>
          </SettingsCard>

          <form onSubmit={handlePasswordSubmit}>
            <SettingsCard
              id="change-password"
              icon={KeyRound}
              title={t("security.passwordTitle")}
              description={t("security.passwordDescription")}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <PasswordField
                  id="current-password"
                  label={t("security.currentPassword")}
                  value={password.current}
                  show={showPasswords}
                  onChange={(current) => setPassword((value) => ({ ...value, current }))}
                  onToggle={() => setShowPasswords((current) => !current)}
                  className="sm:col-span-2"
                />
                <PasswordField
                  id="new-password"
                  label={t("security.newPassword")}
                  value={password.next}
                  show={showPasswords}
                  onChange={(next) => setPassword((value) => ({ ...value, next }))}
                  onToggle={() => setShowPasswords((current) => !current)}
                />
                <PasswordField
                  id="confirm-password"
                  label={t("security.confirmPassword")}
                  value={password.confirm}
                  show={showPasswords}
                  onChange={(confirm) => setPassword((value) => ({ ...value, confirm }))}
                  onToggle={() => setShowPasswords((current) => !current)}
                />
              </div>

              <div className="mt-5 grid gap-2 rounded-lg border border-border bg-muted/20 p-4 text-xs text-muted-foreground sm:grid-cols-3">
                <PasswordRequirement met={passwordIsLongEnough}>{t("security.requirements.length")}</PasswordRequirement>
                <PasswordRequirement met={passwordHasNumber}>{t("security.requirements.number")}</PasswordRequirement>
                <PasswordRequirement met={passwordsMatch}>{t("security.requirements.match")}</PasswordRequirement>
              </div>

              <CardActions>
                <Button type="submit" className="h-10" disabled={!canUpdatePassword}><KeyRound />{t("security.updatePassword")}</Button>
              </CardActions>
            </SettingsCard>
          </form>

          <SettingsCard
            id="referral-link"
            icon={Link2}
            title={t("referral.title")}
            description={t("referral.description")}
          >
            <InputGroup className="h-11 rounded-lg bg-background shadow-none sm:h-10">
              <InputGroupAddon><Link2 /></InputGroupAddon>
              <InputGroupInput aria-label={t("referral.title")} readOnly value={referralLink} className="font-mono text-xs sm:text-sm" />
              <InputGroupAddon align="inline-end">
                <InputGroupButton aria-label={t("referral.copy")} onClick={() => void copyText(referralLink, t("referral.copied"))}>
                  <Copy />
                  <span className="hidden sm:inline">{t("referral.copy")}</span>
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>

            <div className="mt-5 grid overflow-hidden rounded-lg border border-border sm:grid-cols-2">
              <ReferralMetric icon={UsersRound} label={t("referral.people")} value="0" />
              <ReferralMetric icon={CircleDollarSign} label={t("referral.commission")} value="5%" />
            </div>

            <CardActions>
              <p className="text-xs leading-5 text-muted-foreground">{t("referral.hint")}</p>
              <Button asChild type="button" variant="outline" className="h-10">
                <Link href="/member/referrals">{t("referral.manage")}<ExternalLink /></Link>
              </Button>
            </CardActions>
          </SettingsCard>
        </main>
      </div>
    </div>
  );
}

function SettingsCard({
  id,
  icon: Icon,
  title,
  description,
  status,
  children,
}: {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  status?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <Card className="gap-0 overflow-hidden border-border bg-card py-0 shadow-none">
        <CardHeader className="flex-row items-start gap-3 border-b border-border px-4 py-4 sm:px-5">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-muted/30 text-muted-foreground">
            <Icon className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-base tracking-[-0.01em]">{title}</CardTitle>
              {status}
            </div>
            <CardDescription className="mt-1 leading-5">{description}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-4 py-5 sm:px-5">{children}</CardContent>
      </Card>
    </section>
  );
}

function FieldBlock({ label, htmlFor, className, children }: { label: string; htmlFor: string; className?: string; children: ReactNode }) {
  return (
    <div className={`space-y-2 ${className || ""}`}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function CardActions({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-4 -mb-5 mt-5 flex flex-col gap-3 border-t border-border bg-muted/10 px-4 py-4 sm:-mx-5 sm:flex-row sm:items-center sm:justify-end sm:px-5 sm:[&>p]:mr-auto">
      {children}
    </div>
  );
}

function SettingToggle({
  id,
  title,
  description,
  checked,
  onCheckedChange,
  className = "",
}: {
  id: string;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}) {
  return (
    <div className={`flex min-h-16 items-center gap-4 py-3 ${className}`}>
      <Label htmlFor={id} className="min-w-0 flex-1 cursor-pointer flex-col items-start gap-1">
        <span className="text-sm font-medium text-foreground">{title}</span>
        <span className="text-xs leading-5 font-normal text-muted-foreground">{description}</span>
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function NotificationRow({ id, icon: Icon, title, description, checked, onCheckedChange }: {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex min-h-20 items-center gap-3 py-3.5">
      <span className="grid size-8 shrink-0 place-items-center rounded-md border border-border bg-muted/30 text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <Label htmlFor={id} className="min-w-0 flex-1 cursor-pointer flex-col items-start gap-1">
        <span className="text-sm font-medium text-foreground">{title}</span>
        <span className="text-xs leading-5 font-normal text-muted-foreground">{description}</span>
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function DnsValue({ label, value, onCopy }: { label: string; value: string; onCopy?: () => void }) {
  return (
    <div className="min-w-0 rounded-md border border-border bg-background px-3 py-2.5">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <div className="mt-1 flex min-w-0 items-center gap-2">
        <code className="min-w-0 flex-1 truncate text-xs text-foreground">{value}</code>
        {onCopy ? <Button type="button" variant="ghost" size="icon-sm" onClick={onCopy} aria-label={label}><Copy /></Button> : null}
      </div>
    </div>
  );
}

function PasswordField({ id, label, value, show, onChange, onToggle, className = "" }: {
  id: string;
  label: string;
  value: string;
  show: boolean;
  onChange: (value: string) => void;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <FieldBlock label={label} htmlFor={id} className={className}>
      <InputGroup className="h-11 rounded-lg bg-background shadow-none sm:h-10">
        <InputGroupInput id={id} type={show ? "text" : "password"} value={value} onChange={(event) => onChange(event.target.value)} autoComplete="off" />
        <InputGroupAddon align="inline-end">
          <InputGroupButton aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"} onClick={onToggle}>{show ? <EyeOff /> : <Eye />}</InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </FieldBlock>
  );
}

function PasswordRequirement({ met, children }: { met: boolean; children: ReactNode }) {
  return (
    <p className={`flex items-center gap-2 ${met ? "text-foreground" : "text-muted-foreground"}`}>
      <span className={`grid size-4 shrink-0 place-items-center rounded-full border ${met ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
        {met ? <Check className="size-2.5" /> : null}
      </span>
      {children}
    </p>
  );
}

function ReferralMetric({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-4 last:border-b-0 sm:border-r sm:border-b-0 sm:last:border-r-0">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted/50 text-muted-foreground"><Icon className="size-4" /></span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-lg font-semibold tracking-tight text-foreground">{value}</p>
      </div>
    </div>
  );
}
