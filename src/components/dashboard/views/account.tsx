import { Bell, CreditCard, KeyRound, Palette, ShieldCheck, User } from "lucide-react";

import { AppButton, Badge, PageHeader, SoftCard } from "@/components/dashboard/ui";

export function AccountView() {
  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Tài khoản"
        description="Quản lý hồ sơ, bảo mật, thanh toán, thông báo và preferences giao diện."
      />
      <section className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <SoftCard className="p-6">
          <div className="grid size-20 place-items-center rounded-lg bg-amber-100 text-3xl font-bold text-amber-800 ring-1 ring-amber-200">
            Q
          </div>
          <h2 className="mt-5 text-2xl font-bold text-slate-950">qkha</h2>
          <p className="text-sm font-semibold text-slate-500">
            creator@Rekonise.local
          </p>
          <div className="mt-4">
            <Badge tone="emerald">Đã xác minh</Badge>
          </div>
          <AppButton variant="secondary" className="mt-6 w-full">
            <User size={16} />
            Chỉnh hồ sơ
          </AppButton>
        </SoftCard>

        <div className="grid gap-4 md:grid-cols-2">
          {[
            [User, "Thông tin cá nhân", "Tên hiển thị, email, avatar"],
            [KeyRound, "Đổi mật khẩu", "Mật khẩu mạnh và lịch sử đăng nhập"],
            [CreditCard, "Tài khoản nhận tiền", "Ngân hàng, ví điện tử, mặc định"],
            [Bell, "Thông báo", "Email, push, cảnh báo doanh thu"],
            [Palette, "Preferences", "Ngôn ngữ, giao diện, mật độ hiển thị"],
            [ShieldCheck, "Xác minh tài khoản", "KYC, bảo mật và 2FA"],
          ].map(([Icon, title, desc]) => (
            <SoftCard key={title as string} className="p-5">
              <span className="grid size-11 place-items-center rounded-lg bg-blue-50 text-blue-600">
                <Icon size={20} />
              </span>
              <h3 className="mt-4 font-bold text-slate-950">{title as string}</h3>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                {desc as string}
              </p>
            </SoftCard>
          ))}
        </div>
      </section>
    </>
  );
}
