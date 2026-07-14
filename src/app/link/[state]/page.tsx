import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SystemStatusPage, type StatusKind } from "@/components/status/system-status-page";

const states: Record<string, { kind: StatusKind; title: string }> = {
  "not-found": { kind: "linkNotFound", title: "Không tìm thấy link — Linkicom" },
  violation: { kind: "violation", title: "Link bị vô hiệu hoá — Linkicom" },
  deleted: { kind: "deleted", title: "Link đã bị xoá — Linkicom" },
};

export function generateStaticParams() {
  return Object.keys(states).map((state) => ({ state }));
}

export async function generateMetadata({ params }: { params: Promise<{ state: string }> }): Promise<Metadata> {
  const { state } = await params;
  return { title: states[state]?.title ?? "Link không khả dụng — Linkicom" };
}

export default async function LinkStatePage({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params;
  const config = states[state];
  if (!config) notFound();
  return <SystemStatusPage kind={config.kind} />;
}
