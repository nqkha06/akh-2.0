import { notFound } from "next/navigation";

import { AnnouncementEditor } from "@/features/announcements/components/announcement-editor";

export default async function EditAnnouncementPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  return <main className="flex min-w-0 flex-1 flex-col px-4 py-4 lg:px-6 lg:py-6"><AnnouncementEditor id={id} /></main>;
}
