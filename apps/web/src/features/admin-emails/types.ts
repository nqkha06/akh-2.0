export type EmailCategory = "transactional" | "marketing";
export type EmailProviderName = "amazon_ses" | "resend" | "postmark";
export type EmailProviderStatus = "configured" | "incomplete" | "unavailable";
export type EmailSenderStatus =
  | "draft"
  | "pending_verification"
  | "verified"
  | "failed"
  | "disabled";
export type EmailTemplateStatus = "draft" | "active" | "archived";
export type EmailMessageStatus =
  | "queued"
  | "sending"
  | "sent"
  | "delivered"
  | "opened"
  | "clicked"
  | "bounced"
  | "complained"
  | "suppressed"
  | "failed"
  | "cancelled";

export type AdminIdentity = { id: number; name: string; email: string };

export type ProviderHealth = {
  provider: EmailProviderName;
  status: EmailProviderStatus;
  message: string;
  region: string | null;
  trackingSupported: boolean;
  configurationSetsReady: boolean;
  checkedAt: string;
};

export type EmailSettings = {
  id: number;
  provider: EmailProviderName;
  providerStatus: EmailProviderStatus;
  awsRegion: string | null;
  defaultLocale: string;
  transactionalEnabled: boolean;
  marketingEnabled: boolean;
  globalReplyToEmail: string | null;
  trackingEnabled: boolean;
  openTrackingEnabled: boolean;
  clickTrackingEnabled: boolean;
  providerHealth: ProviderHealth;
  updatedBy: AdminIdentity | null;
  createdAt: string;
  updatedAt: string;
};

export type SenderDnsRecord = {
  type: "CNAME" | "TXT" | "MX";
  name: string;
  value: string;
  purpose: "dkim" | "spf" | "dmarc" | "mail_from";
  required: boolean;
};

export type EmailSender = {
  id: number;
  type: EmailCategory;
  emailAddress: string | null;
  domain: string;
  displayName: string;
  replyToEmail: string | null;
  provider: EmailProviderName;
  providerIdentityId: string | null;
  status: EmailSenderStatus;
  verificationError: string | null;
  dnsRecords: SenderDnsRecord[] | null;
  isDefault: boolean;
  verifiedAt: string | null;
  lastCheckedAt: string | null;
  createdBy: AdminIdentity | null;
  updatedBy: AdminIdentity | null;
  createdAt: string;
  updatedAt: string;
  recommendations: string[];
  warnings?: string[];
  _count: { templates: number; messages: number };
};

export type EmailTemplateVariable = {
  key: string;
  label: string;
  type: "string" | "number" | "date" | "url" | "currency";
  required: boolean;
  example?: string | number | null;
  description?: string | null;
};

export type EmailTemplate = {
  id: number;
  code: string;
  name: string;
  description: string | null;
  category: EmailCategory;
  status: EmailTemplateStatus;
  subject: string;
  preheader: string | null;
  htmlContent: string;
  textContent: string;
  variables: EmailTemplateVariable[];
  senderId: number | null;
  version: number;
  lastPublishedAt: string | null;
  sender: Pick<EmailSender, "id" | "emailAddress" | "displayName" | "type" | "status" | "isDefault"> | null;
  createdBy: AdminIdentity | null;
  updatedBy: AdminIdentity | null;
  createdAt: string;
  updatedAt: string;
  _count: { versions: number; messages: number };
};

export type EmailTemplateVersion = {
  id: string;
  templateId: number;
  version: number;
  name: string;
  subject: string;
  createdAt: string;
  publishedById: number | null;
};

export type EmailPreferenceTopic = {
  id: number;
  code: string;
  name: string;
  description: string;
  category: EmailCategory;
  isRequired: boolean;
  isEnabled: boolean;
  displayOrder: number;
  optedIn: number;
  optedOut: number;
  hasPreferenceData: boolean;
  createdAt: string;
  updatedAt: string;
};

export type EmailMessage = {
  id: string;
  userId: number | null;
  providerMessageId: string | null;
  recipientEmail: string;
  fromEmail: string;
  subject: string;
  emailType: EmailCategory | "test";
  status: EmailMessageStatus;
  failureCode: string | null;
  failureMessage: string | null;
  queuedAt: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  template: { id: number; code: string; name: string; category: EmailCategory } | null;
  sender: { id: number; emailAddress: string | null; displayName: string; type: EmailCategory } | null;
  user: { id: number; name: string; email: string; status: string } | null;
};

export type EmailMessageDetail = EmailMessage & {
  templateVersion: number | null;
  events: Array<{
    id: string;
    eventType: string;
    providerEventId: string | null;
    occurredAt: string;
    payload?: unknown;
  }>;
  rawProviderEventsAvailable: boolean;
  rawProviderEventsIncluded: boolean;
};

export type EmailOverview = {
  range: "7d" | "30d" | "90d" | "custom";
  mailType: "all" | EmailCategory;
  period: { from: string; to: string };
  dataAvailability: { hasActivity: boolean; message: string | null };
  metrics: {
    totalSent: number;
    delivered: number;
    failed: number;
    bounced: number;
    complaints: number;
    unsubscribes: number;
    deliveryRate: number;
    bounceRate: number;
    complaintRate: number;
  };
  reputation: { status: "healthy" | "warning"; message: string | null };
  health: {
    sesConfiguration: ProviderHealth;
    domainAuthentication: { status: "verified" | "pending" | "failed"; message: string };
    defaultTransactionalSender: EmailSender | null;
    defaultMarketingSender: EmailSender | null;
    transactionalEnabled: boolean;
    marketingEnabled: boolean;
  };
  deliveryTrend: Array<{
    date: string;
    sent: number;
    delivered: number;
    failed: number;
    bounced: number;
    complaints: number;
  }>;
  topTemplates: Array<{
    template: { id: number; code: string; name: string };
    sent: number;
    failures: number;
    failureRate: number;
  }>;
  recentCriticalEvents: Array<{
    id: string;
    type: string;
    occurredAt: string;
    message: Pick<EmailMessage, "id" | "recipientEmail" | "subject" | "failureCode" | "failureMessage">;
  }>;
};

export type Paginated<T> = {
  items: T[];
  pagination: { page: number; perPage: number; total: number; totalPages: number };
};
