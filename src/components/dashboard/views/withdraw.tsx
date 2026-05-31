import { AlertCircle, Building2, Clock3, CreditCard, Wallet } from "lucide-react";

import {
  AppButton,
  Badge,
  PageHeader,
  SoftCard,
  StatCard,
  TableShell,
} from "@/components/dashboard/ui";

export function WithdrawView() {
  return (
    <>
      <PageHeader
        eyebrow="Payout"
        title="Rút tiền"
        description="Theo dõi số dư, gửi yêu cầu rút tiền và kiểm tra lịch sử giao dịch minh bạch."
      />

      <section className="mb-5 grid gap-4 md:grid-cols-3">
        <StatCard
          label="Số dư khả dụng"
          value="222,105đ"
          detail="Có thể rút ngay"
          icon={<Wallet size={20} />}
          tone="blue"
        />
        <StatCard
          label="Tổng đã rút"
          value="1,840,000đ"
          detail="12 giao dịch"
          icon={<CreditCard size={20} />}
          tone="emerald"
        />
        <StatCard
          label="Đang chờ xử lý"
          value="340,000đ"
          detail="1 yêu cầu"
          icon={<Clock3 size={20} />}
          tone="amber"
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[420px_1fr]">
        <SoftCard className="p-6">
          <div className="mb-5 flex items-center gap-3 rounded-lg bg-amber-50 p-3 text-sm font-bold text-amber-700">
            <AlertCircle size={18} />
            Rút tối thiểu 100,000đ. Xử lý trong 1-3 ngày làm việc.
          </div>
          <div className="grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-bold text-slate-600">
                Số tiền muốn rút
              </span>
              <input
                className="h-12 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                placeholder="VD: 200,000đ"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-bold text-slate-600">
                Phương thức nhận tiền
              </span>
              <select className="h-12 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100">
                <option>Ngân hàng</option>
                <option>Momo</option>
                <option>ZaloPay</option>
              </select>
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-bold text-slate-600">
                Thông tin tài khoản nhận
              </span>
              <input
                className="h-12 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                placeholder="Số tài khoản / ví nhận tiền"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-bold text-slate-600">Ghi chú</span>
              <textarea
                className="min-h-24 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                placeholder="Ghi chú nếu cần"
              />
            </label>
          </div>
          <AppButton className="mt-5 w-full">
            <Building2 size={16} />
            Gửi yêu cầu rút tiền
          </AppButton>
        </SoftCard>

        <TableShell
          headers={["Ngày", "Phương thức", "Số tiền", "Trạng thái"]}
          rows={[
            ["28-05", "Momo", "120,000đ", "Thành công"],
            ["21-05", "Ngân hàng", "340,000đ", "Đang xử lý"],
            ["15-05", "Momo", "80,000đ", "Từ chối"],
          ].map(([date, method, amount, status]) => (
            <tr key={`${date}-${amount}`} className="transition hover:bg-blue-50/35">
              <td className="px-5 py-4">{date}</td>
              <td className="px-5 py-4">{method}</td>
              <td className="px-5 py-4">{amount}</td>
              <td className="px-5 py-4">
                <Badge
                  tone={
                    status === "Thành công"
                      ? "emerald"
                      : status === "Từ chối"
                        ? "rose"
                        : "amber"
                  }
                >
                  {status}
                </Badge>
              </td>
            </tr>
          ))}
        />
      </section>
    </>
  );
}
