import { LinkInBioEditPage } from "@/features/link-in-bio/components/link-in-bio-edit-page"

export default async function EditLinkInBioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <LinkInBioEditPage bioId={id} />
}
