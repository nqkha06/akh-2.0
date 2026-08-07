"use client";

import { CheckCircle2, Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useEffect, useId, useState } from "react";

import { SiteBrandDisplay } from "@/components/site-brand";
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
import { resetPassword } from "@/features/auth/api/auth.client";
import { cn } from "@/lib/utils";

type Errors = {
  password?: string;
  confirmPassword?: string;
};

export function ResetPasswordForm({ token }: { token: string }) {
  const id = useId();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const hasToken = token.length >= 32;

  useEffect(() => {
    if (window.location.search) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Errors = {};
    if (password.length < 8) {
      nextErrors.password = "Mật khẩu cần có ít nhất 8 ký tự.";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      nextErrors.password = "Mật khẩu cần có chữ hoa, chữ thường và chữ số.";
    }
    if (!confirmPassword) {
      nextErrors.confirmPassword = "Vui lòng nhập lại mật khẩu.";
    } else if (confirmPassword !== password) {
      nextErrors.confirmPassword = "Mật khẩu nhập lại chưa khớp.";
    }
    setErrors(nextErrors);
    setMessage("");
    if (Object.keys(nextErrors).length || !hasToken) return;

    setSubmitting(true);
    try {
      await resetPassword({ token, password });
      setCompleted(true);
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Không thể đặt lại mật khẩu. Vui lòng yêu cầu liên kết mới.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="container grid min-h-svh max-w-none items-center justify-center bg-background">
      <div className="mx-auto flex w-full flex-col justify-center space-y-2 py-8 sm:p-8">
        <Link href="/" className="mb-4 flex items-center justify-center">
          <SiteBrandDisplay
            logoClassName="h-9 w-40"
            nameClassName="text-xl font-medium"
          />
        </Link>

        <Card className="w-full max-w-sm gap-4 shadow-sm">
          {completed ? (
            <>
              <CardHeader className="items-center gap-3 text-center">
                <span className="grid size-12 place-items-center rounded-full bg-emerald-500/10 text-emerald-600">
                  <CheckCircle2 className="size-6" aria-hidden="true" />
                </span>
                <div>
                  <CardTitle className="text-lg">Đã cập nhật mật khẩu</CardTitle>
                  <CardDescription className="mt-1.5 leading-5">
                    Tất cả phiên đăng nhập cũ đã được thu hồi để bảo vệ tài khoản.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/login?reason=password-reset">Đăng nhập lại</Link>
                </Button>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="gap-1.5">
                <CardTitle className="flex items-center gap-2 text-lg tracking-tight">
                  <KeyRound className="size-5" aria-hidden="true" />
                  Tạo mật khẩu mới
                </CardTitle>
                <CardDescription className="leading-5">
                  Mật khẩu mới phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường và chữ số.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!hasToken ? (
                  <div className="grid gap-4">
                    <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm leading-5 text-destructive" role="alert">
                      Liên kết đặt lại mật khẩu không hợp lệ hoặc bị thiếu token.
                    </p>
                    <Button asChild variant="outline">
                      <Link href="/forgot-password">Yêu cầu liên kết mới</Link>
                    </Button>
                  </div>
                ) : (
                  <form className="grid gap-4" onSubmit={submit} noValidate>
                    <PasswordField
                      id={`${id}-password`}
                      label="Mật khẩu mới"
                      value={password}
                      error={errors.password}
                      visible={showPassword}
                      onChange={(value) => {
                        setPassword(value);
                        setErrors((current) => ({ ...current, password: undefined }));
                      }}
                      onToggle={() => setShowPassword((current) => !current)}
                    />
                    <PasswordField
                      id={`${id}-confirm-password`}
                      label="Nhập lại mật khẩu"
                      value={confirmPassword}
                      error={errors.confirmPassword}
                      visible={showPassword}
                      onChange={(value) => {
                        setConfirmPassword(value);
                        setErrors((current) => ({
                          ...current,
                          confirmPassword: undefined,
                        }));
                      }}
                      onToggle={() => setShowPassword((current) => !current)}
                    />
                    {message ? (
                      <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm leading-5 text-destructive" role="alert">
                        {message}
                      </p>
                    ) : null}
                    <Button type="submit" disabled={submitting}>
                      <ShieldCheck aria-hidden="true" />
                      {submitting ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
                    </Button>
                  </form>
                )}
              </CardContent>
              <CardFooter className="justify-center">
                <Link href="/login" className="text-sm text-muted-foreground underline underline-offset-4 hover:text-primary">
                  Quay lại đăng nhập
                </Link>
              </CardFooter>
            </>
          )}
        </Card>
      </div>
    </main>
  );
}

function PasswordField({
  id,
  label,
  value,
  error,
  visible,
  onChange,
  onToggle,
}: {
  id: string;
  label: string;
  value: string;
  error?: string;
  visible: boolean;
  onChange: (value: string) => void;
  onToggle: () => void;
}) {
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className={cn("text-sm font-medium", error && "text-destructive")}>
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          className="pe-9"
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          value={value}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(event) => onChange(event.target.value)}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="absolute inset-e-1 top-1/2 -translate-y-1/2 text-muted-foreground"
          onClick={onToggle}
        >
          {visible ? <Eye aria-hidden="true" /> : <EyeOff aria-hidden="true" />}
          <span className="sr-only">{visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}</span>
        </Button>
      </div>
      {error ? <p id={`${id}-error`} className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
