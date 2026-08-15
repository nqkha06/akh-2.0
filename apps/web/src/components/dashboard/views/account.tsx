"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Copy,
  CreditCard,
  Eye,
  EyeOff,
  Globe2,
  KeyRound,
  LoaderCircle,
  Mail,
  Save,
  User,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { PageContainer, PageHeader } from "@/components/dashboard/ui";
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
  InputGroupInput,
  InputGroupText,
  InputGroupButton,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { useMemberCurrency } from "@/features/currencies/components/member-currency-provider";
import { useAuthUser } from "@/features/auth/components/auth-user-provider";
import {
  AuthClientError,
  changeAccountPassword,
} from "@/features/auth/api/auth.client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MemberPaymentMethodsManager } from "@/features/payment-methods/components/member-payment-methods-page";
import {
  getSiteHost,
  useSiteBrand,
} from "@/features/site-settings/components/site-brand-provider";

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

const inputClassName = "h-11 rounded-lg border-border bg-background shadow-none sm:h-10";

export function AccountView() {
  const t = useTranslations("Account");
  const passwordT = useTranslations("ChangePassword");
  const brand = useSiteBrand();
  const siteHost = getSiteHost(brand);
  const currentUser = useAuthUser();
  const currencyPreferences = useMemberCurrency();
  const hydratedProfile = useRef(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [profile, setProfile] = useState<ProfileForm>({
    firstName: "",
    lastName: "",
    email: "",
    bio: t("profile.bioValue"),
  });
  const [currency, setCurrency] = useState(currencyPreferences.currency);
  const [savedCurrency, setSavedCurrency] = useState(
    currencyPreferences.currency,
  );
  const [savingCurrency, setSavingCurrency] = useState(false);
  const [customDomain, setCustomDomain] = useState("");
  const [domainStatus, setDomainStatus] = useState<"idle" | "pending">("idle");
  const [password, setPassword] = useState<PasswordForm>({
    current: "",
    next: "",
    confirm: "",
  });
  const [showPasswords, setShowPasswords] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (hydratedProfile.current) return;

    const nameParts = (currentUser.name || "").trim().split(/\s+/).filter(Boolean);
    const firstName = nameParts.pop() || "";
    hydratedProfile.current = true;
    setProfile((current) => ({
      ...current,
      firstName,
      lastName: nameParts.join(" "),
      email: currentUser.email,
    }));
  }, [currentUser.email, currentUser.name]);

  const displayName =
    [profile.lastName, profile.firstName].filter(Boolean).join(" ") ||
    t("profile.fallbackName", { brand: brand.siteName });
  const initials = useMemo(
    () =>
      displayName
        .split(/\s+/)
        .filter(Boolean)
        .slice(-2)
        .map((part) => part[0]?.toUpperCase())
        .join("") ||
      (brand.siteShortName || brand.siteName).slice(0, 2).toUpperCase(),
    [brand.siteName, brand.siteShortName, displayName],
  );
  const passwordIsLongEnough = password.next.length >= 8;
  const passwordHasNumber = /\d/.test(password.next);
  const passwordHasUppercase = /[A-Z]/.test(password.next);
  const passwordHasLowercase = /[a-z]/.test(password.next);
  const passwordsMatch =
    Boolean(password.next) && password.next === password.confirm;
  const passwordIsDifferent =
    Boolean(password.current && password.next) &&
    password.current !== password.next;
  const canUpdatePassword =
    Boolean(password.current) &&
    passwordIsLongEnough &&
    passwordHasNumber &&
    passwordHasUppercase &&
    passwordHasLowercase &&
    passwordsMatch &&
    passwordIsDifferent;
  const currencyPreview = currencyPreferences.formatCurrency(48.1, {
    targetCurrency: currency,
  });

  const sections: Array<{ id: string; icon: LucideIcon; label: string }> = [
    { id: "personal-information", icon: User, label: t("navigation.personal") },
    { id: "payment-method", icon: CreditCard, label: t("navigation.payment") },
    { id: "currency", icon: CircleDollarSign, label: t("navigation.currency") },
    { id: "custom-domain", icon: Globe2, label: t("navigation.domain") },
    { id: "change-password", icon: KeyRound, label: passwordT("title") },
  ];

  const notifySaved = (section: string) => toast.success(t("toast.sectionSaved", { section }));

  const saveCurrency = async () => {
    setSavingCurrency(true);
    try {
      await currencyPreferences.selectCurrency(currency);
      setSavedCurrency(currency);
      toast.success(t("toast.sectionSaved", { section: t("currency.title") }));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể lưu đơn vị tiền tệ.",
      );
    } finally {
      setSavingCurrency(false);
    }
  };

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

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canUpdatePassword || updatingPassword) return;
    setUpdatingPassword(true);
    setPasswordError("");
    try {
      await changeAccountPassword({
        currentPassword: password.current,
        newPassword: password.next,
      });
      toast.success(passwordT("success"));
      setPassword({ current: "", next: "", confirm: "" });
      setShowPasswords(false);
    } catch (error) {
      const errorKey = error instanceof AuthClientError
        ? ({
            CURRENT_PASSWORD_INCORRECT: "errors.currentIncorrect",
            NEW_PASSWORD_SAME_AS_CURRENT: "errors.sameAsCurrent",
            PASSWORD_NOT_CONFIGURED: "errors.notConfigured",
            PASSWORD_CHANGE_IMPERSONATION_FORBIDDEN: "errors.impersonation",
            PASSWORD_CHANGED_CONCURRENTLY: "errors.concurrent",
          } as const)[error.code || ""]
        : undefined;
      const message = errorKey
        ? passwordT(errorKey)
        : passwordT("errors.generic");
      setPasswordError(message);
      toast.error(message);
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader title={t("title")} />

      <section className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm shadow-black/[0.025]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-primary/[0.08] via-primary/[0.03] to-transparent" />
        <div className="relative flex flex-col gap-5 px-5 py-5 sm:flex-row sm:items-center sm:px-6 sm:py-6">
          <div className="relative shrink-0">
            <Avatar className="size-20 border-4 border-background shadow-sm sm:size-24">
              <AvatarImage
                src={avatarPreview || currentUser.avatar || undefined}
                alt={displayName}
              />
              <AvatarFallback className="text-xl font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              aria-label={t("profile.changeAvatar")}
              onClick={() => avatarInputRef.current?.click()}
              className="absolute -right-1 -bottom-1 grid size-9 place-items-center rounded-full border-4 border-background bg-primary text-primary-foreground shadow-sm transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Camera className="size-4" />
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => handleAvatarChange(event.target.files?.[0])}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="truncate text-xl font-semibold tracking-[-0.025em] text-foreground sm:text-2xl">
                {displayName}
              </h2>
              <Badge className="gap-1 border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                <CheckCircle2 className="size-3.5" />
                {t("verified")}
              </Badge>
            </div>
            <p className="mt-1.5 flex items-center gap-2 truncate text-sm text-muted-foreground">
              <Mail className="size-4 shrink-0" />
              {profile.email || currentUser.email}
            </p>
          </div>
        </div>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav
          aria-label={t("navigation.label")}
          className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-2 shadow-sm shadow-black/[0.02] lg:sticky lg:top-[calc(var(--header-height)+1.5rem)] lg:flex-col lg:rounded-2xl lg:p-3"
        >
          {sections.map(({ id, icon: Icon, label }) => (
            <a
              key={id}
              href={`#${id}`}
              className="group flex min-h-11 shrink-0 items-center gap-2.5 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <Icon className="size-4 transition-colors group-hover:text-primary" />
              <span>{label}</span>
              <ChevronRight className="ml-auto hidden size-3.5 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100 lg:block" />
            </a>
          ))}
        </nav>

        <main className="min-w-0 space-y-6">
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
              footer={<CardActions><Button type="submit" className="h-10"><Save />{t("saveChanges")}</Button></CardActions>}
            >
              <div className="grid gap-5 sm:grid-cols-2">
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
            footer={
              <CardActions>
                <Button
                  type="button"
                  className="h-10"
                  disabled={savingCurrency || currency === savedCurrency}
                  onClick={() => void saveCurrency()}
                >
                  {savingCurrency ? <LoaderCircle className="animate-spin" /> : <Save />}
                  {t("saveChanges")}
                </Button>
              </CardActions>
            }
          >
            <div className="grid items-end gap-4 md:grid-cols-[minmax(0,1fr)_minmax(240px,0.7fr)]">
              <FieldBlock label={t("currency.label")} htmlFor="account-currency">
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger id="account-currency" className={`${inputClassName} w-full`}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {currencyPreferences.availableCurrencies.map((item) => (
                      <SelectItem key={item.id} value={item.code}>
                        {item.code} — {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldBlock>
              <div className="rounded-lg border border-border bg-muted/20 px-4 py-3">
                <p className="text-xs text-muted-foreground">{t("currency.preview")}</p>
                <p className="mt-1 font-mono text-sm font-medium text-foreground">
                  {currencyPreview}
                </p>
              </div>
            </div>
            <p className="mt-4 text-xs leading-5 text-muted-foreground">{t("currency.hint")}</p>
          </SettingsCard>

          <SettingsCard
            id="custom-domain"
            icon={Globe2}
            title={t("domain.title")}
            description={t("domain.description")}
            status={<Badge variant={domainStatus === "pending" ? "secondary" : "outline"}>{t(`domain.status.${domainStatus}`)}</Badge>}
            footer={
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
            }
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
                  value={siteHost || "—"}
                  onCopy={siteHost ? () => void copyText(siteHost, t("domain.copied")) : undefined}
                />
              </div>
            </div>
          </SettingsCard>

          <form onSubmit={handlePasswordSubmit}>
            <SettingsCard
              id="change-password"
              icon={KeyRound}
              title={passwordT("title")}
              description={passwordT("description")}
              footer={
                <CardActions>
                  <Button
                    type="submit"
                    className="h-10"
                    disabled={!canUpdatePassword || updatingPassword}
                  >
                    {updatingPassword ? (
                      <LoaderCircle className="animate-spin" />
                    ) : (
                      <KeyRound />
                    )}
                    {updatingPassword
                      ? passwordT("updating")
                      : passwordT("submit")}
                  </Button>
                </CardActions>
              }
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <PasswordField
                  id="current-password"
                  label={passwordT("currentPassword")}
                  value={password.current}
                  show={showPasswords}
                  onChange={(current) => {
                    setPassword((value) => ({ ...value, current }));
                    setPasswordError("");
                  }}
                  onToggle={() => setShowPasswords((current) => !current)}
                  autoComplete="current-password"
                  showLabel={passwordT("showPassword")}
                  hideLabel={passwordT("hidePassword")}
                  className="sm:col-span-2"
                />
                <PasswordField
                  id="new-password"
                  label={passwordT("newPassword")}
                  value={password.next}
                  show={showPasswords}
                  onChange={(next) => {
                    setPassword((value) => ({ ...value, next }));
                    setPasswordError("");
                  }}
                  onToggle={() => setShowPasswords((current) => !current)}
                  autoComplete="new-password"
                  showLabel={passwordT("showPassword")}
                  hideLabel={passwordT("hidePassword")}
                />
                <PasswordField
                  id="confirm-password"
                  label={passwordT("confirmPassword")}
                  value={password.confirm}
                  show={showPasswords}
                  onChange={(confirm) => {
                    setPassword((value) => ({ ...value, confirm }));
                    setPasswordError("");
                  }}
                  onToggle={() => setShowPasswords((current) => !current)}
                  autoComplete="new-password"
                  showLabel={passwordT("showPassword")}
                  hideLabel={passwordT("hidePassword")}
                />
              </div>

              <div className="mt-5 grid gap-2 rounded-lg border border-border bg-muted/20 p-4 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
                <PasswordRequirement met={passwordIsLongEnough}>
                  {passwordT("requirements.length")}
                </PasswordRequirement>
                <PasswordRequirement met={passwordHasUppercase}>
                  {passwordT("requirements.uppercase")}
                </PasswordRequirement>
                <PasswordRequirement met={passwordHasLowercase}>
                  {passwordT("requirements.lowercase")}
                </PasswordRequirement>
                <PasswordRequirement met={passwordHasNumber}>
                  {passwordT("requirements.number")}
                </PasswordRequirement>
                <PasswordRequirement met={passwordsMatch}>
                  {passwordT("requirements.match")}
                </PasswordRequirement>
                <PasswordRequirement met={passwordIsDifferent}>
                  {passwordT("requirements.different")}
                </PasswordRequirement>
              </div>
              {passwordError ? (
                <p role="alert" className="mt-3 text-sm text-destructive">
                  {passwordError}
                </p>
              ) : null}
            </SettingsCard>
          </form>

        </main>
      </div>
    </PageContainer>
  );
}

function SettingsCard({
  id,
  icon: Icon,
  title,
  description,
  status,
  footer,
  children,
}: {
  id: string;
  icon: LucideIcon;
  title: string;
  description?: string;
  status?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <Card className="gap-0 overflow-hidden rounded-2xl border-border bg-card py-0 shadow-sm shadow-black/[0.025]">
        <CardHeader className="flex-row items-start gap-3.5 border-b border-border/80 px-5 py-5 sm:px-6">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/[0.08] text-primary ring-1 ring-primary/10">
            <Icon className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-base font-semibold tracking-[-0.015em] sm:text-[17px]">
                {title}
              </CardTitle>
              {status}
            </div>
            {description ? (
              <CardDescription className="mt-1.5 max-w-2xl leading-5">
                {description}
              </CardDescription>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="px-5 py-5 sm:px-6 sm:py-6">
          {children}
        </CardContent>
        {footer}
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
    <div data-slot="card-actions" className="flex flex-col gap-3 border-t border-border/80 bg-muted/[0.12] px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6 sm:[&>p]:mr-auto">
      {children}
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

function PasswordField({
  id,
  label,
  value,
  show,
  onChange,
  onToggle,
  autoComplete,
  showLabel,
  hideLabel,
  className = "",
}: {
  id: string;
  label: string;
  value: string;
  show: boolean;
  onChange: (value: string) => void;
  onToggle: () => void;
  autoComplete: "current-password" | "new-password";
  showLabel: string;
  hideLabel: string;
  className?: string;
}) {
  return (
    <FieldBlock label={label} htmlFor={id} className={className}>
      <InputGroup className="h-11 rounded-lg bg-background shadow-none sm:h-10">
        <InputGroupInput
          id={id}
          type={show ? "text" : "password"}
          value={value}
          maxLength={128}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            aria-label={show ? hideLabel : showLabel}
            onClick={onToggle}
          >
            {show ? <EyeOff /> : <Eye />}
          </InputGroupButton>
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
