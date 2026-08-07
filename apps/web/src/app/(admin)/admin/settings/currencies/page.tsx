import { redirect } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { getAdminCurrencies } from "@/features/currencies/api/currencies.server";
import { CurrencySettingsManager } from "@/features/currencies/components/currency-settings-manager";
import { requireAdmin } from "@/lib/auth/guards";

export default async function AdminCurrenciesPage() {
  const { currentUser } = await requireAdmin();
  if (!currentUser.permissions?.includes("currencies.read")) redirect("/admin");
  const currencies = await getAdminCurrencies();

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-4 lg:px-6 lg:py-6">
      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-6">
        <AdminPageHeader
          title="Tiền tệ & tỷ giá"
          description={`Quản lý tiền hiển thị. Tỷ giá được nhập theo quy ước 1 ${currencies.baseCurrency} bằng bao nhiêu đơn vị tiền tệ đích.`}
        />
        <CurrencySettingsManager
          initialData={currencies}
          permissions={currentUser.permissions ?? []}
        />
      </div>
    </main>
  );
}
