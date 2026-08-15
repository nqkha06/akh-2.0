"use client";

import { authenticatedApiFetch } from "@/lib/api-client";
import type {
  EmailCategory,
  EmailMessage,
  EmailMessageDetail,
  EmailOverview,
  EmailPreferenceTopic,
  EmailSender,
  EmailSettings,
  EmailTemplate,
  EmailTemplateStatus,
  EmailTemplateVariable,
  EmailTemplateVersion,
  Paginated,
  ProviderHealth,
} from "../types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await authenticatedApiFetch(path, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...Object.fromEntries(new Headers(init?.headers).entries()),
    },
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { message?: string | string[]; error?: string }
      | null;
    throw new Error(
      Array.isArray(payload?.message)
        ? payload.message.join(", ")
        : payload?.message || payload?.error || "Yêu cầu không thành công.",
    );
  }
  return (await response.json()) as T;
}

export function getEmailSettings() {
  return request<EmailSettings>("/admin/emails/settings", { cache: "no-store" });
}

export function updateEmailSettings(payload: Partial<EmailSettings>) {
  return request<EmailSettings>("/admin/emails/settings", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function checkEmailConnection() {
  return request<ProviderHealth>("/admin/emails/settings/check-connection", {
    method: "POST",
  });
}

export function getEmailOverview(params: URLSearchParams) {
  return request<EmailOverview>(`/admin/emails/overview?${params}`, {
    cache: "no-store",
  });
}

export function listEmailSenders(filters: {
  search?: string;
  type?: string;
  status?: string;
  page?: number;
}) {
  const params = cleanParams({ ...filters, perPage: 20 });
  return request<Paginated<EmailSender>>(`/admin/emails/senders?${params}`);
}

export function createEmailSender(payload: {
  type: EmailCategory;
  emailAddress: string;
  domain: string;
  displayName: string;
  replyToEmail?: string | null;
}) {
  return request<EmailSender>("/admin/emails/senders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateEmailSender(id: number, payload: Partial<EmailSender>) {
  return request<EmailSender>(`/admin/emails/senders/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function checkSenderVerification(id: number) {
  return request<EmailSender>(`/admin/emails/senders/${id}/check-verification`, {
    method: "POST",
  });
}

export function setDefaultEmailSender(id: number) {
  return request<EmailSender>(`/admin/emails/senders/${id}/set-default`, {
    method: "POST",
  });
}

export function deleteEmailSender(id: number) {
  return request<{ id: number; deleted: true }>(`/admin/emails/senders/${id}`, {
    method: "DELETE",
  });
}

export function listEmailTemplates(filters: {
  search?: string;
  category?: string;
  status?: string;
  page?: number;
}) {
  const params = cleanParams({ ...filters, perPage: 20 });
  return request<Paginated<EmailTemplate>>(`/admin/emails/templates?${params}`);
}

export function getEmailTemplate(id: number) {
  return request<EmailTemplate>(`/admin/emails/templates/${id}`);
}

export type EmailTemplatePayload = {
  code?: string;
  name: string;
  description?: string | null;
  category: EmailCategory;
  status: EmailTemplateStatus;
  subject: string;
  preheader?: string | null;
  htmlContent: string;
  textContent?: string | null;
  variables: EmailTemplateVariable[];
  senderId?: number | null;
};

export function createEmailTemplate(payload: EmailTemplatePayload & { code: string }) {
  return request<EmailTemplate>("/admin/emails/templates", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateEmailTemplate(id: number, payload: EmailTemplatePayload) {
  return request<EmailTemplate>(`/admin/emails/templates/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function archiveEmailTemplate(id: number) {
  return request<EmailTemplate>(`/admin/emails/templates/${id}`, {
    method: "DELETE",
  });
}

export function previewEmailTemplate(id: number, sampleData?: Record<string, unknown>) {
  return request<{ subject: string; preheader: string | null; html: string; text: string; sampleData: Record<string, unknown> }>(
    `/admin/emails/templates/${id}/preview`,
    { method: "POST", body: JSON.stringify({ sampleData }) },
  );
}

export function sendTemplateTest(
  id: number,
  recipientEmail: string,
  sampleData?: Record<string, unknown>,
) {
  return request<EmailMessage>(`/admin/emails/templates/${id}/test-send`, {
    method: "POST",
    body: JSON.stringify({ recipientEmail, sampleData }),
  });
}

export function getEmailTemplateVersions(id: number) {
  return request<EmailTemplateVersion[]>(`/admin/emails/templates/${id}/versions`);
}

export function restoreEmailTemplateVersion(id: number, version: number) {
  return request<EmailTemplate>(
    `/admin/emails/templates/${id}/restore-version/${version}`,
    { method: "POST" },
  );
}

export function listEmailPreferenceTopics() {
  return request<EmailPreferenceTopic[]>("/admin/emails/preference-topics");
}

export function createEmailPreferenceTopic(
  payload: Omit<EmailPreferenceTopic, "id" | "optedIn" | "optedOut" | "hasPreferenceData" | "createdAt" | "updatedAt">,
) {
  return request<EmailPreferenceTopic>("/admin/emails/preference-topics", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateEmailPreferenceTopic(id: number, payload: Partial<EmailPreferenceTopic>) {
  return request<EmailPreferenceTopic>(`/admin/emails/preference-topics/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function listEmailActivity(filters: Record<string, string | number | undefined>) {
  const params = cleanParams({ ...filters, perPage: 20 });
  return request<Paginated<EmailMessage>>(`/admin/emails/activity?${params}`);
}

export function getEmailActivity(id: string, includeRaw = false) {
  return request<EmailMessageDetail>(
    `/admin/emails/activity/${id}?includeRaw=${includeRaw}`,
  );
}

function cleanParams(values: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== "" && value !== "all") {
      params.set(key, String(value));
    }
  }
  return params;
}
