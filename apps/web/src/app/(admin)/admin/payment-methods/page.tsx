import { AdminHeader } from "@/components/admin/admin-header";
import { AdminPaymentMethodsPage } from "@/features/payment-methods/components/admin-payment-methods-page";

export default function PaymentMethodsAdminPage() {
  return (
    <>
      <AdminHeader title="Payment Methods" />
      <main className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-4 lg:px-6 lg:py-6">
        <div className="max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-primary">
            Payout configuration
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.6px]">
            Phương thức thanh toán
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Cấu hình loại tài khoản nhận tiền, mức phí, hạn mức tối thiểu và các
            thông tin member cần cung cấp.
          </p>
        </div>
        <AdminPaymentMethodsPage />
      </main>
    </>
  );
}
