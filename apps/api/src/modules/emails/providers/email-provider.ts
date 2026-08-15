import type { EmailCategory } from "../email.constants";

export type ProviderHealth = {
  provider: "amazon_ses" | "resend" | "postmark";
  status: "configured" | "incomplete" | "unavailable";
  message: string;
  region: string | null;
  trackingSupported: boolean;
  configurationSetsReady: boolean;
  checkedAt: string;
};

export type SenderDnsRecord = {
  type: "CNAME" | "TXT" | "MX";
  name: string;
  value: string;
  purpose: "dkim" | "spf" | "dmarc" | "mail_from";
  required: boolean;
};

export type SenderIdentityInput = {
  domain: string;
};

export type SenderIdentityResult = {
  identity: string;
  status: "pending_verification" | "verified" | "failed";
  dnsRecords: SenderDnsRecord[];
  verifiedAt?: Date | null;
  error?: string | null;
  warnings: string[];
};

export type ProviderSendInput = {
  messageId: string;
  fromEmail: string;
  fromName: string;
  replyToEmail?: string | null;
  recipientEmail: string;
  subject: string;
  html: string;
  text: string;
  type: EmailCategory | "test";
  templateCode?: string | null;
  templateVersion?: number | null;
};

export type SendEmailResult = {
  providerMessageId: string;
  acceptedAt: Date;
};

export interface EmailProvider {
  checkConnection(): Promise<ProviderHealth>;
  createOrGetIdentity(input: SenderIdentityInput): Promise<SenderIdentityResult>;
  getIdentityStatus(identity: string): Promise<SenderIdentityResult>;
  sendEmail(input: ProviderSendInput): Promise<SendEmailResult>;
  sendTestEmail(input: ProviderSendInput): Promise<SendEmailResult>;
}
