import type {
  SupportAttachment,
  SupportCategory,
  SupportMessage,
  SupportRequestStatus,
  SupportTicketPriority,
} from "@/components/dashboard/support/types";

export type SupportUser = {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
};

export type AdminSupportTicketListItem = {
  id: number;
  reference: string;
  subject: string;
  category: SupportCategory;
  status: SupportRequestStatus;
  priority: SupportTicketPriority;
  relatedResource: string | null;
  user: SupportUser;
  assignedTo: SupportUser | null;
  messageCount: number;
  attachmentCount: number;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminSupportTicket = {
  id: number;
  reference: string;
  subject: string;
  category: string;
  categoryValue: SupportCategory;
  status: SupportRequestStatus;
  priority: SupportTicketPriority;
  relatedResource: string | null;
  technicalInfo?: string | null;
  user: SupportUser;
  assignedTo: SupportUser | null;
  content: string;
  attachments: SupportAttachment[];
  messages: SupportMessage[];
  lastMessageAt: string;
  resolvedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminSupportTicketsResponse = {
  items: AdminSupportTicketListItem[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    pageCount: number;
  };
  summary: {
    open: number;
    waiting: number;
    urgent: number;
    unassigned: number;
  };
};
