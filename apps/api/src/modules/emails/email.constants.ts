export const EMAIL_PROVIDERS = ["amazon_ses", "resend", "postmark"] as const;
export const EMAIL_PROVIDER_STATUSES = [
  "configured",
  "incomplete",
  "unavailable",
] as const;
export const EMAIL_CATEGORIES = ["transactional", "marketing"] as const;
export const EMAIL_SENDER_STATUSES = [
  "draft",
  "pending_verification",
  "verified",
  "failed",
  "disabled",
] as const;
export const EMAIL_TEMPLATE_STATUSES = ["draft", "active", "archived"] as const;
export const EMAIL_VARIABLE_TYPES = [
  "string",
  "number",
  "date",
  "url",
  "currency",
] as const;
export const EMAIL_TYPES = ["transactional", "marketing", "test"] as const;
export const EMAIL_MESSAGE_STATUSES = [
  "queued",
  "sending",
  "sent",
  "delivered",
  "opened",
  "clicked",
  "bounced",
  "complained",
  "suppressed",
  "failed",
  "cancelled",
] as const;
export const EMAIL_PREFERENCE_SOURCES = [
  "default",
  "user_settings",
  "unsubscribe_link",
  "admin",
  "import",
] as const;

export type EmailProviderName = (typeof EMAIL_PROVIDERS)[number];
export type EmailCategory = (typeof EMAIL_CATEGORIES)[number];
export type EmailSenderStatus = (typeof EMAIL_SENDER_STATUSES)[number];
export type EmailTemplateStatus = (typeof EMAIL_TEMPLATE_STATUSES)[number];
export type EmailMessageStatus = (typeof EMAIL_MESSAGE_STATUSES)[number];

export const SES_CONFIGURATION_SETS: Record<EmailCategory, string> = {
  transactional: "transactional",
  marketing: "marketing",
};

export const PUBLIC_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "icloud.com",
  "me.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
]);
