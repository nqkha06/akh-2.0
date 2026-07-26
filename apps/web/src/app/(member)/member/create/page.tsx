import { PageContainer, PageHeader } from "@/components/dashboard/ui";
import SocialLinksGenerator from "./demo";

export default function MemberCreatePage() {
  const pageTitle = "Tạo Social Link";

  return (
    <PageContainer>
      <PageHeader
        title={pageTitle}
        description="Tạo và cấu hình Social link để chia sẻ nội dung của bạn."
      />
      <SocialLinksGenerator />
    </PageContainer>
  );
}
