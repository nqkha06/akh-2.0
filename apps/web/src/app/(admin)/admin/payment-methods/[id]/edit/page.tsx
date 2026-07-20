import { notFound } from "next/navigation";

import { PaymentMethodEditorPage } from "@/features/payment-methods/components/payment-method-editor-page";

export default async function EditPaymentMethodPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const paymentMethodId = Number(id);

  if (!Number.isInteger(paymentMethodId) || paymentMethodId <= 0) {
    notFound();
  }

  return (
    <main className="flex min-w-0 flex-1 flex-col px-4 py-4 lg:px-6 lg:py-6">
      <PaymentMethodEditorPage paymentMethodId={paymentMethodId} />
    </main>
  );
}
