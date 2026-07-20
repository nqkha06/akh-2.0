import { notFound } from "next/navigation";

import { LanguageEditorPage } from "@/features/languages/components/language-editor-page";

export default async function EditLanguagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const languageId = Number(id);
  if (!Number.isInteger(languageId) || languageId < 1) notFound();

  return (
    <main className="flex min-w-0 flex-1 flex-col px-4 py-4 lg:px-6 lg:py-6">
      <LanguageEditorPage languageId={languageId} />
    </main>
  );
}
