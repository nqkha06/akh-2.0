import { AppLayout } from "@/components/dashboard/shell"

import { LinkInBioEditPage } from "../../components/link-in-bio-edit-page"

export default async function EditLinkInBioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <AppLayout><LinkInBioEditPage bioId={id} /></AppLayout>
}
