"use client";

export type LinkReportReason =
  | "spam"
  | "malware"
  | "impersonation"
  | "copyright"
  | "adult"
  | "other";

export type CreateLinkReportInput = {
  email: string;
  reportedUrl: string;
  reason: LinkReportReason;
  details: string;
};

export async function createPublicLinkReport(input: CreateLinkReportInput) {
  const response = await fetch("/api/backend/public/link-reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const payload = (await response.json().catch(() => null)) as {
    reference?: string;
    createdAt?: string;
    message?: string | string[];
    error?: string;
  } | null;
  if (!response.ok) {
    throw new Error(
      Array.isArray(payload?.message)
        ? payload.message.join(", ")
        : payload?.message || payload?.error || "Không thể gửi báo cáo.",
    );
  }
  if (!payload?.reference) throw new Error("Phản hồi báo cáo không hợp lệ.");
  return { reference: payload.reference, createdAt: payload.createdAt ?? null };
}
