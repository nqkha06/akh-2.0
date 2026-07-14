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
        "relative isolate flex min-h-[100svh] flex-col overflow-x-hidden bg-slate-950 text-slate-950",
        "supports-[height:100dvh]:min-h-[100dvh]",
        rootClassName,
      )}
    >
      {/* Fallback background */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-30 bg-slate-950"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-20 overflow-hidden"
      >
        {/* Background do page truyền vào */}
        <div className="absolute inset-0">
          {background}
        </div>

        {/* Overlay chính, đảm bảo nội dung dễ đọc */}
        <div className="absolute inset-0 bg-slate-950/45" />

        {/* Ánh sáng nhẹ ở phía trên */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.2),transparent_42%)]" />

        {/* Gradient làm card nổi lên */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/5 via-slate-950/10 to-slate-950/55" />

        {/* Một chút màu nền khi không có ảnh */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_85%,rgba(14,165,233,0.12),transparent_35%)]" />
      </div>

      {/* Header */}
      <div className="relative z-30 shrink-0">
        <ShowHeader
          onShare={shareCurrentLink}
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
            "px-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4",
            "sm:px-5 sm:pb-[max(2rem,env(safe-area-inset-bottom))] sm:pt-6",
            className,
          )}
        >
          {children}
        </section>
      </div>
    </main>
  );
}