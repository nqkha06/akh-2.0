import {
  createMemberSupportTicket,
  getMemberSupportTicket,
  getMemberSupportTickets,
  replyMemberSupportTicket,
} from "@/features/support/api/support.client";
import type {
  SupportDashboardData,
  SupportDataSource,
} from "./types";

const dashboard: SupportDashboardData = {
  attachmentConfig: {
    acceptedTypes: ".png,.jpg,.jpeg,.webp,.txt,.log,.pdf",
    maxSizeMb: 5,
  },
  requests: [],
};

export function getSupportContentData() {
  return structuredClone(dashboard);
}

export const supportDataSource: SupportDataSource = {
  async getDashboard() {
    return {
      ...getSupportContentData(),
      requests: await getMemberSupportTickets(),
    };
  },
  getRequest: getMemberSupportTicket,
  createRequest: createMemberSupportTicket,
  replyToRequest: replyMemberSupportTicket,
};

export const categoryLabels = {
  usage: "Câu hỏi sử dụng",
  technical: "Lỗi kỹ thuật",
  social_links: "Social links",
  files: "Files",
  link_in_bio: "Link-in-bio",
  monetization: "Kiếm tiền",
  withdrawal: "Rút tiền",
  rewards: "Phần thưởng",
  account: "Tài khoản và bảo mật",
  abuse: "Báo cáo lạm dụng",
  other: "Khác",
} as const;
