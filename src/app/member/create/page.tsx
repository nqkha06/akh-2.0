import { DashboardShell } from "@/components/dashboard/shell";
import { PageHeader } from "@/components/dashboard/ui";
import SocialLinksGenerator from "./demo";

export default function MemberCreatePage() {
  const pageTitle = "Tạo Social Link";

  return (
    <DashboardShell pageTitle={pageTitle}>
      <div className="mx-auto w-full max-w-[1280px] space-y-6">
        <PageHeader
          title={pageTitle}
          description="Tạo và cấu hình Social link để chia sẻ nội dung của bạn."
        />
        <SocialLinksGenerator />
      </div>
    </DashboardShell>
  );
}
