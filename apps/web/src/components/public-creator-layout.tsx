"use client";

import {
  type ReactNode,
  useCallback,
} from "react";
import { toast } from "sonner";

import { ShowHeader } from "@/components/show-header";
import { cn } from "@/lib/utils";

type PublicCreatorLayoutProps = {
  background?: ReactNode;
  topAction?: ReactNode;
  afterHeader?: ReactNode;
  children: ReactNode;
  variant?: "default" | "linear";

  /**
   * Class cho vùng chứa nội dung chính.
   */
  className?: string;

  /**
   * Class cho thẻ main ngoài cùng.
   */
  rootClassName?: string;
};

async function copyTextToClipboard(
  value: string,
): Promise<void> {
  if (
    window.isSecureContext &&
    navigator.clipboard?.writeText
  ) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea =
    document.createElement("textarea");

  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.setAttribute(
    "aria-hidden",
    "true",
  );

  Object.assign(textarea.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "1px",
    height: "1px",
    padding: "0",
    border: "0",
    opacity: "0",
    pointerEvents: "none",
  });

  document.body.appendChild(textarea);

  textarea.focus();
  textarea.select();

  const copied = document.execCommand("copy");

  document.body.removeChild(textarea);

  if (!copied) {
    throw new Error("Copy command failed");
  }
}

export function PublicCreatorLayout({
  background,
  topAction,
  afterHeader,
  children,
  className,
  rootClassName,
  variant = "default",
}: PublicCreatorLayoutProps) {
  const shareCurrentLink =
    useCallback(async () => {
      const url = window.location.href;
      const title =
        document.title || "Shared link";

      if (navigator.share) {
        try {
          await navigator.share({
            title,
            url,
          });

          return;
        } catch (error) {
          if (
            error instanceof DOMException &&
            error.name === "AbortError"
          ) {
            return;
          }

          /*
           * Một số trình duyệt có navigator.share
           * nhưng vẫn có thể báo lỗi.
           * Thử copy link thay vì dừng luôn.
           */
        }
      }

      try {
        await copyTextToClipboard(url);
        toast.success("Đã sao chép link");
      } catch {
        toast.error(
          "Không thể sao chép link",
        );
      }
    }, []);

  return (
    <main
      className={cn(
        "relative isolate flex min-h-[100svh] flex-col overflow-x-clip",
        variant === "linear"
          ? "bg-slate-50 text-slate-950 dark:bg-[#010102] dark:text-[#f7f8f8]"
          : "bg-slate-100 text-slate-950 dark:bg-slate-950",
        "supports-[height:100dvh]:min-h-[100dvh]",
        rootClassName,
      )}
    >
      {/* Fallback background */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none fixed inset-0 -z-30",
          variant === "linear" ? "bg-slate-50 dark:bg-[#010102]" : "bg-slate-100 dark:bg-slate-950",
        )}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-20 overflow-hidden"
      >
        {/* Background do page truyền vào */}
        <div className="absolute inset-0">
          {background}
        </div>

        {variant === "linear" ? (
          <div className="absolute inset-0 bg-white/75 dark:bg-black/70" />
        ) : (
          <>
            <div className="absolute inset-0 bg-slate-950/45" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.2),transparent_42%)]" />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/5 via-slate-950/10 to-slate-950/55" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_85%,rgba(14,165,233,0.12),transparent_35%)]" />
          </>
        )}
      </div>

      {/* Header */}
      <div className="sticky top-0 z-30 shrink-0">
        <ShowHeader
          onShare={shareCurrentLink}
          variant={variant}
        />
      </div>

      {/* Action nổi như nút bật âm thanh */}
      {topAction ? (
        <div
          className={cn(
            "fixed right-3 z-40 sm:right-5",
            "top-[calc(env(safe-area-inset-top)+4.75rem)] sm:top-24",
          )}
        >
          {topAction}
        </div>
      ) : null}

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        {/* Chỉ tạo khoảng không khi có nội dung */}
        {afterHeader ? (
          <div className="mx-auto w-full max-w-5xl px-4 pt-4 sm:px-6 sm:pt-6">
            {afterHeader}
          </div>
        ) : null}

        <section
          className={cn(
            "mx-auto flex w-full flex-1 items-center justify-center",
            variant === "linear"
              ? "px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-6 sm:px-6 sm:pb-[max(3rem,env(safe-area-inset-bottom))] sm:pt-10"
              : "px-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 sm:px-5 sm:pb-[max(2rem,env(safe-area-inset-bottom))] sm:pt-6",
            className,
          )}
        >
          {children}
        </section>
      </div>
    </main>
  );
}
