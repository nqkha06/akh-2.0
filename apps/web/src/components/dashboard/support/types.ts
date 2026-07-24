export type SupportRequestStatus = "submitted" | "in_progress" | "waiting_user" | "answered" | "resolved" | "closed";
export type SupportTicketPriority = "low" | "normal" | "high" | "urgent";
export type SupportCategory = "usage" | "technical" | "social_links" | "files" | "link_in_bio" | "monetization" | "withdrawal" | "rewards" | "account" | "abuse" | "other";

export interface SupportMessage {
  id: number;
  sender: string;
  senderRole: "user" | "support" | "system";
  content: string;
  createdAt: string;
  isInternal?: boolean;
  attachments?: SupportAttachment[];
}

export interface SupportAttachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  downloadPath: string;
}

export interface SupportRequest {
  id: number;
  reference: string;
  subject: string;
  category: string;
  categoryValue: SupportCategory;
  status: SupportRequestStatus;
  priority: SupportTicketPriority;
  createdAt: string;
  updatedAt: string;
  content: string;
  attachments: SupportAttachment[];
  messages: SupportMessage[];
  lastMessageAt: string;
  assignedTo?: {
    id: number;
    name: string;
    email: string;
    avatar?: string | null;
  } | null;
}

export interface SupportDashboardData {
  requests: SupportRequest[];
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
  getRequest(id: number): Promise<SupportRequest>;
  createRequest(input: CreateSupportRequestInput): Promise<SupportRequest>;
  replyToRequest(id: number, content: string): Promise<SupportRequest>;
}
