"use client";

import { CheckCircle2, Loader2, MailCheck } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useEffect, useRef, useState } from "react";

import { SiteBrandDisplay } from "@/components/site-brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { resendEmailVerification, verifyEmail } from "../api/auth.client";

export function VerifyEmailCard({ token }: { token: string }) {
  const started = useRef(false);
  const [state, setState] = useState<"verifying" | "success" | "error">(
    token.length >= 32 ? "verifying" : "error",
  );
  const [message, setMessage] = useState(
    token.length >= 32 ? "Đang xác minh địa chỉ email…" : "Liên kết xác minh bị thiếu hoặc không hợp lệ.",
  );
  const [email, setEmail] = useState("");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    window.history.replaceState({}, "", window.location.pathname);
    if (started.current || token.length < 32) return;
    started.current = true;
    void verifyEmail(token)
      .then((result) => {
        setState("success");
        setMessage(result.message);
      })
      .catch((error: unknown) => {
        setState("error");
        setMessage(error instanceof Error ? error.message : "Không thể xác minh email.");
      });
  }, [token]);

  async function resend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;
    try {
      setResending(true);
      const result = await resendEmailVerification(email);
      setMessage(result.message);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể gửi lại email.");
    } finally {
      setResending(false);
    }
  }

  return (
    <main className="container grid min-h-svh max-w-none items-center justify-center bg-background">
      <div className="mx-auto w-full max-w-sm py-8">
        <Link href="/" className="mb-6 flex justify-center"><SiteBrandDisplay logoClassName="h-9 w-40" nameClassName="text-xl font-medium" /></Link>
        <Card className="shadow-sm">
          <CardHeader className="items-center text-center">
            <span className={`grid size-12 place-items-center rounded-full ${state === "success" ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
              {state === "verifying" ? <Loader2 className="animate-spin" /> : state === "success" ? <CheckCircle2 /> : <MailCheck />}
            </span>
            <CardTitle>{state === "success" ? "Email đã xác minh" : state === "verifying" ? "Đang xác minh" : "Cần liên kết mới"}</CardTitle>
            <CardDescription className="leading-5">{message}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {state === "success" ? <Button asChild className="w-full"><Link href="/login">Đăng nhập</Link></Button> : null}
            {state === "error" ? (
              <form className="space-y-3" onSubmit={resend}>
                <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" required />
                <Button type="submit" className="w-full" variant="outline" disabled={resending}>{resending ? <Loader2 className="animate-spin" /> : <MailCheck />}{resending ? "Đang gửi…" : "Gửi lại email xác minh"}</Button>
              </form>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
