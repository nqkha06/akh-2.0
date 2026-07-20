import type { LucideIcon } from "lucide-react";

export type SupportRequestStatus = "submitted" | "in_progress" | "waiting_user" | "answered" | "resolved" | "closed";
export type SupportCategory = "usage" | "technical" | "social_links" | "files" | "link_in_bio" | "monetization" | "withdrawal" | "rewards" | "account" | "abuse" | "other";

export interface SupportTopic {
  id: string;
  title: string;
  description: string;
  articleCount?: number;
  href: string;
  icon: LucideIcon;
}

export interface SupportArticle {
  id: string;
  title: string;
  summary: string;
  category: string;
  readingTime?: string;
  href: string;
}

export interface SupportMessage {
  id: string;
  sender: string;
  senderRole: "user" | "support";
  content: string;
  createdAt: string;
  attachments?: string[];
}

export interface SupportRequest {
  id: string;
  reference: string;
  subject: string;
  category: string;
  categoryValue: SupportCategory;
  status: SupportRequestStatus;
  createdAt: string;
  updatedAt: string;
  content: string;
  attachments: string[];
  messages: SupportMessage[];
}

export interface SupportDashboardData {
  topics: SupportTopic[];
  articles: SupportArticle[];
  requests: SupportRequest[];
  systemStatus: {
    state: "operational" | "incident" | "unknown";
    message: string;
    affectedService?: string;
    href?: string;
  };
  contact: {
    responseTime?: string;
    workingHours?: string;
    channels: string[];
  };
  attachmentConfig: {
    acceptedTypes: string;
    maxSizeMb: number;
  };
}

export interface CreateSupportRequestInput {
  category: SupportCategory;
  subject: string;
  content: string;
  relatedResource?: string;
  attachTechnicalInfo: boolean;
  attachments: File[];
}

export interface SupportDataSource {
  getDashboard(): Promise<SupportDashboardData>;
  createRequest(input: CreateSupportRequestInput): Promise<SupportRequest>;
  replyToRequest(id: string, content: string): Promise<SupportMessage>;
}
