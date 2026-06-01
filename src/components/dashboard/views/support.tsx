import { LifeBuoy, LockKeyhole, MessageCircle, Search, Shield, Wallet, Link2, PhoneCall, Mail } from "lucide-react";

import { AppButton, Badge, PageHeader, SoftCard, TableShell } from "@/components/dashboard/ui";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const faqs = [
  {
    question: "Bao lâu thì yêu cầu rút tiền được xử lý?",
    answer: "Thông thường trong 1-3 ngày làm việc. Trạng thái sẽ cập nhật trong mục Rút tiền.",
  },
  {
    question: "Vì sao link bị tạm dừng?",
    answer: "Link có thể bị tạm dừng do vi phạm nội dung hoặc hiệu suất thấp. Hãy kiểm tra chi tiết trong Quản lí liên kết.",
  },
  {
    question: "Cách tăng tỉ lệ unlock?",
    answer: "Tối ưu tiêu đề, cover và chọn action phù hợp với đối tượng. Xem gợi ý trong Bảng tổng quan.",
  },
];

export function SupportView() {
  return (
    <>
      <PageHeader
        eyebrow="Support center"
        title="Hỗ trợ"
        description="Tìm câu trả lời nhanh, gửi ticket và theo dõi trạng thái xử lý hỗ trợ."
      />

      <SoftCard className="mb-5 p-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold text-slate-950">
            Bạn cần hỗ trợ gì?
          </h2>
          <div className="mt-5 flex h-14 items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 shadow-sm">
            <Search className="text-slate-400" size={20} />
            <input
              className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400"
              placeholder="Tìm hướng dẫn về rút tiền, liên kết, hoa hồng..."
            />
          </div>
        </div>
      </SoftCard>

      <section className="mb-5 grid gap-4 md:grid-cols-5 sm:grid-cols-2">
        {[
          [LifeBuoy, "Tài khoản"],
          [Wallet, "Rút tiền"],
          [Link2, "Liên kết"],
          [MessageCircle, "Hoa hồng"],
          [Shield, "Bảo mật"],
        ].map(([Icon, label]) => (
          <SoftCard key={label as string} className="p-4 text-center">
            <span className="mx-auto grid size-11 place-items-center rounded-lg bg-blue-50 text-blue-600">
              <Icon size={20} />
            </span>
            <p className="mt-3 text-sm font-bold text-slate-700">
              {label as string}
            </p>
          </SoftCard>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <TableShell
          headers={["Ticket", "Danh mục", "Trạng thái", "Cập nhật"]}
          rows={[
            ["Webhook YouTube không nhận", "Liên kết", "Đang xử lý", "2 giờ trước"],
            ["Yêu cầu duyệt campaign", "Hoa hồng", "Đã phản hồi", "Hôm qua"],
            ["Sai số liệu CPM", "Rút tiền", "Mới", "2 ngày trước"],
          ].map(([title, category, status, updated]) => (
            <tr key={title} className="transition hover:bg-blue-50/35">
              <td className="px-5 py-4">{title}</td>
              <td className="px-5 py-4">{category}</td>
              <td className="px-5 py-4">
                <Badge
                  tone={
                    status === "Mới"
                      ? "blue"
                      : status === "Đã phản hồi"
                        ? "emerald"
                        : "amber"
                  }
                >
                  {status}
                </Badge>
              </td>
              <td className="px-5 py-4">{updated}</td>
            </tr>
          ))}
        />

        <div className="space-y-5">
          <SoftCard className="p-6">
            <LockKeyhole size={24} className="text-blue-600" />
            <h2 className="mt-4 text-lg font-bold text-slate-950">
              Gửi yêu cầu hỗ trợ
            </h2>
            <div className="mt-4 grid gap-3">
              <input
                className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                placeholder="Tiêu đề"
              />
              <textarea
                className="min-h-28 rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                placeholder="Mô tả vấn đề"
              />
            </div>
            <AppButton className="mt-4 w-full">Gửi ticket</AppButton>
          </SoftCard>

          <SoftCard className="p-6">
            <h3 className="text-lg font-bold text-slate-950">FAQ nhanh</h3>
            <div className="mt-4 space-y-3">
              {faqs.map((faq) => (
                <Collapsible key={faq.question}>
                  <CollapsibleTrigger className="flex w-full items-center justify-between rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-left text-sm font-bold text-slate-700 transition hover:border-blue-200">
                    {faq.question}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-4 pb-3 pt-2 text-sm font-semibold leading-6 text-slate-500">
                    {faq.answer}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </SoftCard>

          <SoftCard className="p-6">
            <h3 className="text-lg font-bold text-slate-950">Liên hệ nhanh</h3>
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3">
                <PhoneCall size={18} className="text-emerald-600" />
                <div>
                  <p className="text-sm font-bold text-slate-800">Live chat</p>
                  <p className="text-xs font-semibold text-slate-500">Online 24/7</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3">
                <Mail size={18} className="text-blue-600" />
                <div>
                  <p className="text-sm font-bold text-slate-800">support@Rekonise.com</p>
                  <p className="text-xs font-semibold text-slate-500">Phản hồi trong 12h</p>
                </div>
              </div>
            </div>
          </SoftCard>
        </div>
      </section>
    </>
  );
}
