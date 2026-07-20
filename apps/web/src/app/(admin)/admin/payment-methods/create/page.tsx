import { PaymentMethodEditorPage } from "@/features/payment-methods/components/payment-method-editor-page";

export default function CreatePaymentMethodPage() {
  return (
    <main className="flex min-w-0 flex-1 flex-col px-4 py-4 lg:px-6 lg:py-6">
      <PaymentMethodEditorPage />
    </main>
  );
}
