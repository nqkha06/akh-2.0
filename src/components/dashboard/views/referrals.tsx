import { Copy, Share2, UserCheck, Users, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  AppButton,
  Badge,
  PageHeader,
  SoftCard,
  StatCard,
  TableShell,
} from "@/components/dashboard/ui";

const referredUsers = [
  ["Minh Studio", "Đang hoạt động", "12,400đ"],
  ["Hana Creator", "Chờ kích hoạt", "0đ"],
  ["Tool Maker", "Đang hoạt động", "8,900đ"],
  ["Design Lab", "Đã khóa", "0đ"],
];

export function ReferralsView() {
  const t = useTranslations("SimplePages.referrals");

  return (
    <>
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
        action={
          <AppButton>
            <Share2 size={16} />
            {t("share")}
          </AppButton>
        }
      />

      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <SoftCard className="overflow-hidden p-6">
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-6">
            <Badge tone="emerald">Reward campaign</Badge>
            <h2 className="mt-5 max-w-xl text-3xl font-bold tracking-tight text-slate-950">
              Mời creator mới, nhận hoa hồng trọn đời từ doanh thu giới thiệu.
            </h2>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <div className="flex min-h-12 flex-1 items-center rounded-lg border border-blue-100 bg-white px-4 font-bold text-slate-700">
                Rekonise.com/ref/qkha
              </div>
              <button className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 font-bold text-white transition hover:bg-blue-700">
                <Copy size={17} />
                Copy
              </button>
            </div>
          </div>
        </SoftCard>

        <div className="grid gap-4">
          <StatCard
            label="Đã giới thiệu"
            value="42"
            detail="+6 người tháng này"
            icon={<Users size={20} />}
            tone="blue"
          />
          <StatCard
            label="Đang hoạt động"
            value="31"
            detail="73.8% active rate"
            icon={<UserCheck size={20} />}
            tone="emerald"
          />
          <StatCard
            label="Hoa hồng referral"
            value="0đ"
            detail="Sẵn sàng khi đối tác phát sinh"
            icon={<Wallet size={20} />}
            tone="violet"
          />
        </div>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_380px]">
        <TableShell
          headers={["Người được giới thiệu", "Trạng thái", "Hoa hồng"]}
          rows={referredUsers.map(([name, status, commission]) => (
            <tr key={name} className="transition hover:bg-blue-50/35">
              <td className="px-5 py-4">{name}</td>
              <td className="px-5 py-4">
                <Badge tone={status === "Đang hoạt động" ? "emerald" : "slate"}>
                  {status}
                </Badge>
              </td>
              <td className="px-5 py-4">{commission}</td>
            </tr>
          ))}
        />

        <SoftCard className="p-5">
          <h3 className="text-lg font-bold text-slate-950">
            3 bước giới thiệu
          </h3>
          <div className="mt-5 space-y-4">
            {[
              ["Copy link", "Chia sẻ link giới thiệu của bạn."],
              ["Bạn bè đăng ký", "Người được mời tạo tài khoản."],
              ["Nhận hoa hồng", "Hoa hồng tự động ghi nhận."],
            ].map(([title, desc], index) => (
              <div key={title} className="flex gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-emerald-50 font-bold text-emerald-700">
                  {index + 1}
                </span>
                <div>
                  <p className="font-bold text-slate-800">{title}</p>
                  <p className="text-sm font-semibold text-slate-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </SoftCard>
      </section>
    </>
  );
}
