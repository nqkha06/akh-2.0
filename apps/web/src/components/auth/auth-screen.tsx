"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Script from "next/script";
import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Eye, EyeOff, LogIn, Mail, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SiteBrandDisplay } from "@/components/site-brand";
import {
  loginAccount,
  loginWithGoogle,
  registerAccount,
} from "@/features/auth/api/auth.client";
import { useSiteBrand } from "@/features/site-settings/components/site-brand-provider";
import { cn } from "@/lib/utils";

type AuthMode = "login" | "register" | "forgot";
type FieldName =
  | "name"
  | "email"
  | "password"
  | "confirmPassword"
  | "terms"
  | "rememberMe";
type FieldErrors = Partial<Record<FieldName, string>>;

type GoogleIdentity = {
  accounts: {
    id: {
      initialize(options: {
        client_id: string;
        callback: (response: { credential?: string }) => void;
      }): void;
      renderButton(
        parent: HTMLElement,
        options: {
          type: "standard";
          theme: "outline";
          size: "large";
          text: "signin_with" | "signup_with";
          shape: "rectangular";
          logo_alignment: "left";
          width: number;
          locale: string;
        },
      ): void;
    };
  };
};

const pageCopy = {
  login: {
    title: "Đăng nhập",
    description: "Nhập email và mật khẩu để đăng nhập vào tài khoản.",
    switchText: "Bạn chưa có tài khoản?",
    switchLabel: "Đăng ký",
    switchHref: "/register",
    submit: "Đăng nhập",
  },
  register: {
    title: "Tạo tài khoản",
    description: "Nhập thông tin bên dưới để tạo tài khoản.",
    switchText: "Bạn đã có tài khoản?",
    switchLabel: "Đăng nhập",
    switchHref: "/login",
    submit: "Đăng ký",
  },
  forgot: {
    title: "Quên mật khẩu",
    description: "Nhập email đã đăng ký để nhận hướng dẫn đặt lại mật khẩu.",
    switchText: "Bạn đã nhớ mật khẩu?",
    switchLabel: "Đăng nhập",
    switchHref: "/login",
    submit: "Gửi hướng dẫn",
  },
} as const;

function Brand() {
  return (
    <Link href="/" className="mb-4 flex items-center justify-center">
      <SiteBrandDisplay
        logoClassName="h-9 w-40"
        nameClassName="text-xl font-medium"
      />
    </Link>
  );
}

function Field({
  id,
  label,
  error,
  className,
  children,
}: {
  id: string;
  label: ReactNode;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("grid gap-2", className)}>
      <label
        htmlFor={id}
        className={cn(
          "flex items-center gap-2 text-sm leading-none font-medium select-none",
          error && "text-destructive",
        )}
      >
        {label}
      </label>
      {children}
      {error ? <p id={`${id}-error`} className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function validateForm(mode: AuthMode, form: HTMLFormElement) {
  const formData = new FormData(form);
  const errors: FieldErrors = {};
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (mode === "register" && name.length < 2) errors.name = "Vui lòng nhập họ và tên.";
  if (!email) errors.email = "Vui lòng nhập email.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Email chưa đúng định dạng.";

  if (mode !== "forgot") {
    if (!password) errors.password = "Vui lòng nhập mật khẩu.";
    else if (password.length < 8) errors.password = "Mật khẩu cần có ít nhất 8 ký tự.";
    else if (mode === "register" && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      errors.password = "Mật khẩu cần có chữ hoa, chữ thường và chữ số.";
    }
  }

  if (mode === "register") {
    if (!confirmPassword) errors.confirmPassword = "Vui lòng nhập lại mật khẩu.";
    else if (confirmPassword !== password) errors.confirmPassword = "Mật khẩu nhập lại chưa khớp.";
    if (!formData.get("terms")) errors.terms = "Bạn cần đồng ý với điều khoản để tiếp tục.";
  }

  return errors;
}

export function AuthScreen({
  mode,
  googleClientId = "",
  redirectTo = "/member",
  referralCode,
  initialMessage = "",
}: {
  mode: AuthMode;
  googleClientId?: string;
  redirectTo?: string;
  referralCode?: string;
  initialMessage?: string;
}) {
  const router = useRouter();
  const brand = useSiteBrand();
  const fieldPrefix = useId();
  const copy = pageCopy[mode];
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState(initialMessage);
  const [messageIsSuccess, setMessageIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const rememberMeRef = useRef(rememberMe);

  const fieldId = (name: FieldName) => `${fieldPrefix}-${name}`;

  function clearField(field: FieldName) {
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
    if (message) setMessage("");
  }

  useEffect(() => {
    rememberMeRef.current = rememberMe;
  }, [rememberMe]);

  useEffect(() => {
    const container = googleButtonRef.current;
    const google = (window as Window & { google?: GoogleIdentity }).google;
    if (!googleClientId || !googleReady || !container || !google) return;

    google.accounts.id.initialize({
      client_id: googleClientId,
      callback: ({ credential }) => {
        if (!credential) {
          setMessage("Google không trả về thông tin đăng nhập hợp lệ.");
          setIsSubmitting(false);
          return;
        }

        setErrors({});
        setMessage("");
        setMessageIsSuccess(false);
        setIsSubmitting(true);
        void loginWithGoogle({
          idToken: credential,
          referralCode,
          rememberMe: rememberMeRef.current,
        })
          .then(() => {
            router.push(redirectTo);
            router.refresh();
          })
          .catch((error: unknown) => {
            setMessage(
              error instanceof Error
                ? error.message
                : "Không thể đăng nhập bằng Google.",
            );
            setIsSubmitting(false);
          });
      },
    });

    container.replaceChildren();
    google.accounts.id.renderButton(container, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: mode === "register" ? "signup_with" : "signin_with",
      shape: "rectangular",
      logo_alignment: "left",
      width: Math.min(Math.max(container.clientWidth, 200), 400),
      locale: "vi",
    });
  }, [googleClientId, googleReady, mode, redirectTo, referralCode, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateForm(mode, event.currentTarget);
    setErrors(nextErrors);
    setMessageIsSuccess(false);
    if (Object.keys(nextErrors).length > 0) {
      setMessage("");
      return;
    }

    if (mode === "forgot") {
      setMessage("Yêu cầu hợp lệ — chức năng gửi email sẽ được triển khai ở bước tiếp theo.");
      setMessageIsSuccess(true);
      return;
    }

    const formData = new FormData(event.currentTarget);
    setIsSubmitting(true);
    setMessage("");

    try {
      if (mode === "register") {
        await registerAccount({
          name: String(formData.get("name") || ""),
          email: String(formData.get("email") || ""),
          password: String(formData.get("password") || ""),
          referralCode,
        });
      }

      await loginAccount({
        email: String(formData.get("email") || ""),
        password: String(formData.get("password") || ""),
        rememberMe,
      });
      router.push(redirectTo);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error
        ? error.message
        : "Không thể kết nối máy chủ xác thực. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const submitIcon = mode === "login"
    ? <LogIn aria-hidden="true" />
    : mode === "register"
      ? <UserPlus aria-hidden="true" />
      : <Mail aria-hidden="true" />;

  return (
    <main className="container grid min-h-svh max-w-none items-center justify-center bg-background">
      {googleClientId ? (
        <Script
          src="https://accounts.google.com/gsi/client?hl=vi"
          strategy="afterInteractive"
          onReady={() => setGoogleReady(true)}
          onError={() =>
            setMessage("Không thể tải Google Sign-In. Vui lòng thử lại.")
          }
        />
      ) : null}
      <div className="fixed top-0 left-0 z-[2147483647] h-0.5 w-full bg-transparent" aria-hidden="true">
        <div className="h-full w-0 bg-muted-foreground" />
      </div>

      <div className="mx-auto flex w-full flex-col justify-center space-y-2 py-8 sm:p-8">
        <Brand />

        <Card className="w-full max-w-sm gap-4 shadow-sm">
          <CardHeader className="gap-1.5">
            <CardTitle className="text-lg tracking-tight">{copy.title}</CardTitle>
            <CardDescription className="leading-5">
              {mode === "register"
                ? `Nhập thông tin bên dưới để tạo tài khoản ${brand.siteName}.`
                : copy.description}{" "}
              <span className="max-sm:hidden"><br /></span>
              {copy.switchText}{" "}
              <Link href={copy.switchHref} className="text-nowrap underline underline-offset-4 hover:text-primary">
                {copy.switchLabel}
              </Link>
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form className="grid gap-3" onSubmit={handleSubmit} noValidate>
              {mode === "register" ? (
                <Field id={fieldId("name")} label="Họ và tên" error={errors.name}>
                  <Input
                    id={fieldId("name")}
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Nguyễn Văn A"
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? `${fieldId("name")}-error` : undefined}
                    onChange={() => clearField("name")}
                  />
                </Field>
              ) : null}

              <Field id={fieldId("email")} label="Email" error={errors.email}>
                <Input
                  id={fieldId("email")}
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? `${fieldId("email")}-error` : undefined}
                  onChange={() => clearField("email")}
                />
              </Field>

              {mode !== "forgot" ? (
                <Field
                  id={fieldId("password")}
                  className="relative"
                  error={errors.password}
                  label={
                    <>
                      Mật khẩu
                      {mode === "login" ? (
                        <Link href="/forgot-password" className="absolute inset-e-0 -top-0.5 text-sm font-medium text-muted-foreground hover:opacity-75">
                          Quên mật khẩu?
                        </Link>
                      ) : null}
                    </>
                  }
                >
                  <div className="relative rounded-md">
                    <Input
                      id={fieldId("password")}
                      className="pe-9"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete={mode === "register" ? "new-password" : "current-password"}
                      placeholder="********"
                      aria-invalid={Boolean(errors.password)}
                      aria-describedby={errors.password ? `${fieldId("password")}-error` : undefined}
                      onChange={() => clearField("password")}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      className="absolute inset-e-1 top-1/2 -translate-y-1/2 text-muted-foreground"
                      onClick={() => setShowPassword((current) => !current)}
                    >
                      {showPassword ? <Eye aria-hidden="true" /> : <EyeOff aria-hidden="true" />}
                      <span className="sr-only">{showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}</span>
                    </Button>
                  </div>
                </Field>
              ) : null}

              {mode === "register" ? (
                <Field id={fieldId("confirmPassword")} label="Nhập lại mật khẩu" error={errors.confirmPassword}>
                  <Input
                    id={fieldId("confirmPassword")}
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="********"
                    aria-invalid={Boolean(errors.confirmPassword)}
                    aria-describedby={errors.confirmPassword ? `${fieldId("confirmPassword")}-error` : undefined}
                    onChange={() => clearField("confirmPassword")}
                  />
                </Field>
              ) : null}

              {mode === "register" && referralCode ? (
                <p className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                  Mã giới thiệu: <strong className="font-mono text-foreground">{referralCode}</strong>
                </p>
              ) : null}

              {mode === "register" ? (
                <div className="grid gap-1.5">
                  <label htmlFor={fieldId("terms")} className="flex cursor-pointer items-start gap-2 text-xs leading-5 text-muted-foreground">
                    <input
                      id={fieldId("terms")}
                      name="terms"
                      type="checkbox"
                      className="mt-0.5 size-4 shrink-0 accent-primary"
                      aria-invalid={Boolean(errors.terms)}
                      onChange={() => clearField("terms")}
                    />
                    <span>Tôi đồng ý với Điều khoản dịch vụ và Chính sách quyền riêng tư.</span>
                  </label>
                  {errors.terms ? <p className="text-xs text-destructive">{errors.terms}</p> : null}
                </div>
              ) : null}

              {mode === "login" ? (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={fieldId("rememberMe")}
                    name="rememberMe"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                  />
                  <label
                    htmlFor={fieldId("rememberMe")}
                    className="cursor-pointer text-sm text-muted-foreground select-none"
                  >
                    Ghi nhớ đăng nhập
                  </label>
                </div>
              ) : null}

              {message ? (
                <p
                  className={cn(
                    "rounded-md border px-3 py-2 text-sm leading-5",
                    messageIsSuccess
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : "border-destructive/30 bg-destructive/10 text-destructive",
                  )}
                  role={messageIsSuccess ? "status" : "alert"}
                  aria-live="polite"
                >
                  {message}
                </p>
              ) : null}

              <Button className="mt-2" type="submit" disabled={isSubmitting}>
                {submitIcon}
                {isSubmitting ? "Đang xử lý..." : copy.submit}
              </Button>

              {mode !== "forgot" && googleClientId ? (
                <>
                  <div className="relative my-2">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Hoặc tiếp tục với</span>
                    </div>
                  </div>
                  <div
                    ref={googleButtonRef}
                    className={cn(
                      "flex min-h-10 w-full justify-center overflow-hidden",
                      isSubmitting && "pointer-events-none opacity-60",
                    )}
                    aria-busy={isSubmitting}
                  />
                </>
              ) : null}

            </form>
          </CardContent>

          <CardFooter>
            <p className="px-4 text-center text-sm leading-5 text-muted-foreground sm:px-8">
              Khi tiếp tục, bạn đồng ý với{" "}
              <Link href="/" className="underline underline-offset-4 hover:text-primary">Điều khoản dịch vụ</Link>
              {" "}và{" "}
              <Link href="/" className="underline underline-offset-4 hover:text-primary">Chính sách quyền riêng tư</Link>.
            </p>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
