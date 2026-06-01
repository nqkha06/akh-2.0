import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, ExternalLink, LockKeyhole } from "lucide-react";

/* eslint-disable @next/next/no-img-element */

import { getLink } from "@/lib/api-client";

export const dynamic = "force-dynamic";

export default async function PublicLinkPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const link = await getLink(slug).catch(() => null);

  if (!link) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <section className="mx-auto max-w-xl rounded-lg border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_rgba(15,23,42,0.06)]">
        {link.coverImageUrl ? (
          <img
            src={link.coverImageUrl}
            alt={link.title}
            className="mb-5 h-52 w-full rounded-lg object-cover"
          />
        ) : (
          <div className="mb-5 grid h-36 place-items-center rounded-lg bg-gradient-to-br from-blue-50 to-emerald-50 text-blue-600">
            <LockKeyhole size={34} />
          </div>
        )}

        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">{link.title}</h1>
          {link.subtitle ? (
            <p className="mt-2 text-sm font-medium text-slate-500">
              {link.subtitle}
            </p>
          ) : null}
        </div>

        <div className="mt-6 space-y-3">
          {link.actions.map((action) => (
            <a
              key={action.id}
              href={action.url}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-11 items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              <span>
                {action.platform} · {action.action}
              </span>
              <CheckCircle2 size={17} />
            </a>
          ))}
        </div>

        <a
          href={link.destinationUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-6 flex h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800"
        >
          Mở liên kết
          <ExternalLink size={17} />
        </a>

        <Link
          href="/links"
          className="mt-4 block text-center text-sm font-semibold text-slate-500 transition hover:text-slate-950"
        >
          Quay lại quản lý liên kết
        </Link>
      </section>
    </main>
  );
}
