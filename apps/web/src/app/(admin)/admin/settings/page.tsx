import Link from "next/link";
import { redirect } from "next/navigation";
import { Banknote, ChevronRight, ImageIcon, SlidersHorizontal } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card, CardContent } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/guards";

const settingItems = [
  {
    title: "Business settings",
    description:
      "Đăng ký, tiền hạch toán, hoa hồng, loyalty, upload, vận hành và thư viện preset.",
    href: "/admin/settings/business",
    permission: "settings.read",
    icon: SlidersHorizontal,
  },
  {
    title: "Thông tin & nhận diện",
    description:
      "Tên website, logo, favicon, ảnh SEO, mạng xã hội và thông tin liên hệ.",
    href: "/admin/settings/appearance",
    permission: "settings.read",
    icon: ImageIcon,
  },
  {
    title: "Tiền tệ & tỷ giá",
    description:
      "Danh mục tiền hiển thị, tỷ giá theo tiền hạch toán và tiền hiển thị mặc định.",
    href: "/admin/settings/currencies",
    permission: "currencies.read",
    icon: Banknote,
  },
] as const;

export default async function AdminSettingsPage() {
  const { currentUser } = await requireAdmin();
  const permissions = currentUser.permissions ?? [];
  if (
    !permissions.includes("settings.read") &&
    !permissions.includes("currencies.read")
  ) {
    redirect("/admin");
  }
  const visibleItems = settingItems.filter((item) =>
    permissions.includes(item.permission),
  );

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-4 lg:px-6 lg:py-6">
      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-6">
        <AdminPageHeader
          title="Cài đặt hệ thống"
          description="Trung tâm cấu hình thông tin công khai và các quy ước vận hành dùng chung cho website."
        />
        <div className="grid gap-4 md:grid-cols-2">
          {visibleItems.map(({ title, description, href, icon: Icon }) => (
            <Card
              key={href}
              className="group gap-0 rounded-xl py-0 shadow-none transition-colors hover:border-foreground/20"
            >
              <CardContent className="p-0">
                <Link
                  href={href}
                  className="flex min-h-36 items-start gap-4 p-5 outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg border bg-muted/30 text-muted-foreground">
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="font-semibold tracking-[-0.01em]">
                      {title}
                    </span>
                    <span className="mt-1.5 block text-sm leading-6 text-muted-foreground">
                      {description}
                    </span>
                  </span>
                  <ChevronRight className="mt-2 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
