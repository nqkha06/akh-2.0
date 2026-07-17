import { LinkEditPage } from "@/features/links/components/link-edit-page";

export default async function EditSocialLinkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <LinkEditPage linkId={id} />;
}
