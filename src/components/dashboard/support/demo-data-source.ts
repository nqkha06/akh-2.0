import { BookOpen, CircleDollarSign, FileText, Gift, Landmark, Link2, LockKeyhole, Rocket, ShieldAlert, Wrench } from "lucide-react";

import type { CreateSupportRequestInput, SupportDashboardData, SupportDataSource, SupportMessage, SupportRequest } from "./types";

let dashboard: SupportDashboardData = {
  topics: [
    { id: "getting-started", title: "Bắt đầu với Rekonise", description: "Thiết lập tài khoản và tạo nội dung đầu tiên.", articleCount: 5, href: "#support-faq", icon: Rocket },
    { id: "account", title: "Tài khoản và bảo mật", description: "Đăng nhập, xác minh và bảo vệ tài khoản.", articleCount: 6, href: "#support-faq", icon: LockKeyhole },
    { id: "social-links", title: "Social links", description: "Tạo, quản lý và theo dõi hiệu suất liên kết.", articleCount: 8, href: "/member/links", icon: Link2 },
    { id: "files", title: "Files", description: "Tải lên và dùng file làm nội dung đích.", articleCount: 4, href: "/member/files", icon: FileText },
    { id: "link-in-bio", title: "Link-in-bio", description: "Xuất bản và quản lý trang giới thiệu.", articleCount: 5, href: "/member/bio", icon: BookOpen },
    { id: "monetization", title: "Kiếm tiền", description: "Điều kiện, hiệu suất và doanh thu nội dung.", articleCount: 5, href: "/member/earnings", icon: CircleDollarSign },
    { id: "withdrawal", title: "Rút tiền", description: "Số dư, phương thức nhận và trạng thái giao dịch.", articleCount: 6, href: "/member/withdraw", icon: Landmark },
    { id: "rewards", title: "Phần thưởng", description: "Chuỗi hoạt động, nhiệm vụ và cột mốc.", articleCount: 4, href: "/member/rewards", icon: Gift },
    { id: "verification", title: "Thanh toán và xác minh", description: "Thông tin nhận tiền và yêu cầu xác minh.", articleCount: 3, href: "#support-faq", icon: ShieldAlert },
    { id: "technical", title: "Báo lỗi kỹ thuật", description: "Khắc phục lỗi hiển thị hoặc tính năng.", href: "#create-support-request", icon: Wrench },
  ],
  articles: [
    { id: "article-social-link", title: "Cách tạo Social link đầu tiên", summary: "Các bước cấu hình nội dung đích và hành động mở khóa.", category: "Social links", readingTime: "4 phút", href: "#support-faq" },
    { id: "article-files", title: "Cách dùng file làm destination", summary: "Tải file lên và kết nối file với Social link.", category: "Files", readingTime: "3 phút", href: "#support-faq" },
    { id: "article-bio", title: "Thiết lập trang Link-in-bio", summary: "Tạo hồ sơ, thêm liên kết và xuất bản trang.", category: "Link-in-bio", readingTime: "5 phút", href: "#support-faq" },
    { id: "article-money", title: "Điều kiện bật monetization", summary: "Các điều kiện cần đáp ứng trước khi bắt đầu kiếm tiền.", category: "Kiếm tiền", readingTime: "4 phút", href: "#support-faq" },
    { id: "article-withdraw", title: "Vì sao yêu cầu rút tiền đang xử lý?", summary: "Hiểu các bước xác minh và trạng thái giao dịch.", category: "Rút tiền", readingTime: "3 phút", href: "#support-faq" },
    { id: "article-rewards", title: "Cách duy trì chuỗi phần thưởng", summary: "Hoạt động hợp lệ và điều kiện giữ chuỗi mỗi ngày.", category: "Phần thưởng", readingTime: "3 phút", href: "#support-faq" },
  ],
  systemStatus: { state: "unknown", message: "Chưa có dữ liệu trạng thái hệ thống trực tiếp." },
  contact: { channels: ["Yêu cầu hỗ trợ trong dashboard"] },
  attachmentConfig: { acceptedTypes: ".png,.jpg,.jpeg,.webp,.txt,.log,.pdf", maxSizeMb: 10 },
  requests: [
    {
      id: "support-1042", reference: "RK-1042", subject: "Lượt mở khóa chưa được cập nhật", category: "Social links", categoryValue: "social_links", status: "waiting_user", createdAt: "2026-07-12T09:20:00+07:00", updatedAt: "2026-07-14T15:40:00+07:00", content: "Lượt mở khóa của một Social link chưa thay đổi sau lần truy cập gần nhất.", attachments: [],
      messages: [
        { id: "message-1", sender: "Bạn", senderRole: "user", content: "Lượt mở khóa của một Social link chưa thay đổi sau lần truy cập gần nhất.", createdAt: "2026-07-12T09:20:00+07:00" },
        { id: "message-2", sender: "Đội ngũ Rekonise", senderRole: "support", content: "Chúng tôi đã kiểm tra. Bạn vui lòng gửi URL của Social link để tiếp tục đối chiếu lượt truy cập hợp lệ.", createdAt: "2026-07-14T15:40:00+07:00" },
      ],
    },
    { id: "support-1028", reference: "RK-1028", subject: "Xác minh phương thức nhận tiền", category: "Rút tiền", categoryValue: "withdrawal", status: "resolved", createdAt: "2026-07-05T10:15:00+07:00", updatedAt: "2026-07-08T11:30:00+07:00", content: "Tôi cần kiểm tra trạng thái xác minh phương thức nhận tiền.", attachments: [], messages: [{ id: "message-3", sender: "Bạn", senderRole: "user", content: "Tôi cần kiểm tra trạng thái xác minh phương thức nhận tiền.", createdAt: "2026-07-05T10:15:00+07:00" }] },
  ],
};

export function getSupportDemoData() {
  const { topics, ...serializableData } = dashboard;
  return {
    ...structuredClone(serializableData),
    topics: topics.map((topic) => ({ ...topic })),
  };
}

export const supportDataSource: SupportDataSource = {
  async getDashboard() {
    return getSupportDemoData();
  },
  async createRequest(input: CreateSupportRequestInput) {
    await new Promise((resolve) => setTimeout(resolve, 650));
    const createdAt = new Date().toISOString();
    const request: SupportRequest = {
      id: `support-${Date.now()}`,
      reference: `RK-${Date.now().toString().slice(-5)}`,
      subject: input.subject,
      category: categoryLabels[input.category],
      categoryValue: input.category,
      status: "submitted",
      createdAt,
      updatedAt: createdAt,
      content: input.content,
      attachments: input.attachments.map((file) => file.name),
      messages: [{ id: `message-${Date.now()}`, sender: "Bạn", senderRole: "user", content: input.content, createdAt, attachments: input.attachments.map((file) => file.name) }],
    };
    dashboard = { ...dashboard, requests: [request, ...dashboard.requests] };
    return structuredClone(request);
  },
  async replyToRequest(id: string, content: string) {
    await new Promise((resolve) => setTimeout(resolve, 450));
    const request = dashboard.requests.find((item) => item.id === id);
    if (!request) throw new Error("Không tìm thấy yêu cầu hỗ trợ.");
    if (request.status === "closed") throw new Error("Yêu cầu này đã đóng.");
    const message: SupportMessage = { id: `message-${Date.now()}`, sender: "Bạn", senderRole: "user", content, createdAt: new Date().toISOString() };
    dashboard = { ...dashboard, requests: dashboard.requests.map((item) => item.id === id ? { ...item, updatedAt: message.createdAt, status: "in_progress", messages: [...item.messages, message] } : item) };
    return structuredClone(message);
  },
};

export const categoryLabels = {
  usage: "Câu hỏi sử dụng", technical: "Lỗi kỹ thuật", social_links: "Social links", files: "Files", link_in_bio: "Link-in-bio", monetization: "Kiếm tiền", withdrawal: "Rút tiền", rewards: "Phần thưởng", account: "Tài khoản và bảo mật", abuse: "Báo cáo lạm dụng", other: "Khác",
} as const;
