import { notFound } from "next/navigation";

import { MenuEditor } from "@/features/admin-menus/components/menu-editor";

export default async function EditWebsiteMenuPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();

  return (
    <main className="flex min-w-0 flex-1 flex-col px-4 py-4 lg:px-6 lg:py-6">
      <MenuEditor menuId={id} />
    </main>
  );
}
