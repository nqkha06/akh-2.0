import { notFound } from "next/navigation";

import { UiTranslationsEditor } from "@/features/languages/components/ui-translations-editor";

export default async function LanguageTranslationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const languageId = Number(id);
  if (!Number.isInteger(languageId) || languageId <= 0) notFound();
  return <UiTranslationsEditor languageId={languageId} />;
}
