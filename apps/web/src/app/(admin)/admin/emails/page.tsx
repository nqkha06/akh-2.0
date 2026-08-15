import type { Metadata } from "next";

import { EmailOperationsCenter } from "@/features/admin-emails/components/email-operations-center";

export const metadata: Metadata = {
  title: "Email Operations Center",
};

export default function AdminEmailsPage() {
  return (
    <main className="flex min-w-0 flex-1 flex-col px-4 py-4 lg:px-6 lg:py-6">
      <EmailOperationsCenter />
    </main>
  );
}
