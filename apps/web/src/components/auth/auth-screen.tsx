"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, useId, useState } from "react";
import { Eye, EyeOff, LogIn, Mail, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { useSiteBrand } from "@/features/site-settings/components/site-brand-provider";
import { cn } from "@/lib/utils";
import { registerAccount } from "@/lib/api-client";

type AuthMode = "login" | "register" | "forgot";
type FieldName = "name" | "email" | "password" | "confirmPassword" | "terms";
type FieldErrors = Partial<Record<FieldName, string>>;

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

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.91h5.39a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.97-4.33 2.97-7.4Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.98-.9 6.63-2.43l-3.24-2.53c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.61A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.39 13.87A6.02 6.02 0 0 1 6.07 12c0-.65.11-1.28.32-1.87V7.52H3.04A10 10 0 0 0 2 12c0 1.61.39 3.14 1.04 4.48l3.35-2.61Z" />
      <path fill="#EA4335" d="M12 6c1.47 0 2.79.51 3.83 1.5l2.87-2.87A9.63 9.63 0 0 0 12 2a10 10 0 0 0-8.96 5.52l3.35 2.61C7.18 7.76 9.39 6 12 6Z" />
    </svg>
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
  googleEnabled = false,
  redirectTo = "/member",
  referralCode,
  initialMessage = "",
}: {
  mode: AuthMode;
  googleEnabled?: boolean;
  redirectTo?: string;
  referralCode?: string;
  initialMessage?: string;
}) {
  const router = useRouter();
  const brand = useSiteBrand();
  const fieldPrefix = useId();
  const copy = pageCopy[mode];
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState(initialMessage);
  const [messageIsSuccess, setMessageIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fieldId = (name: FieldName) => `${fieldPrefix}-${name}`;

  function clearField(field: FieldName) {
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
    if (message) setMessage("");
  }

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

      const result = await signIn("credentials", {
        email: String(formData.get("email") || ""),
        password: String(formData.get("password") || ""),
        redirect: false,
        redirectTo,
      });

      if (!result?.ok || result.error) {
        setMessage(
          mode === "register"
            ? "Tài khoản đã tạo nhưng không thể đăng nhập tự động. Hãy đăng nhập lại."
            : result?.error === "CredentialsSignin" ||
                result?.code === "credentials"
              ? "Email hoặc mật khẩu không chính xác."
              : "Không thể đăng nhập lúc này. Vui lòng thử lại.",
        );
        return;
      }

      router.push(result.url || redirectTo);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error
        ? error.message
        : "Không thể kết nối máy chủ xác thực. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogle() {
    setErrors({});
    setMessageIsSuccess(false);
    if (!googleEnabled) {
      setMessage("Google OAuth chưa được cấu hình trong môi trường hiện tại.");
      return;
    }

    setIsSubmitting(true);
    if (referralCode) {
      const referralResponse = await fetch("/api/auth/referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referralCode }),
      });
      if (!referralResponse.ok) {
        setMessage("Không thể lưu mã giới thiệu. Vui lòng thử lại.");
        setIsSubmitting(false);
        return;
      }
    }
    await signIn("google", { redirectTo });
  }

  const submitIcon = mode === "login"
    ? <LogIn aria-hidden="true" />
    : mode === "register"
      ? <UserPlus aria-hidden="true" />
      : <Mail aria-hidden="true" />;

  return (
    <main className="container grid min-h-svh max-w-none items-center justify-center bg-background">
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

              {mode !== "forgot" ? (
                <>
                  <div className="relative my-2">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Hoặc tiếp tục với</span>
                    </div>
                  </div>
                  <Button type="button" variant="outline" onClick={handleGoogle} disabled={isSubmitting}>
                    <GoogleIcon /> Google
                  </Button>
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
