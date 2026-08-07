"use client";

import { Copy, ExternalLink } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { PageStatus } from "@/features/admin-pages/types";
import {
  canViewPublicPage,
  copyPublicPageUrl,
  publicPagePath,
} from "@/features/pages/public-page-url";

export function PagePublicActions({
  slug,
  status,
  showCopy = true,
}: {
  slug: string;
  status: PageStatus;
  showCopy?: boolean;
}) {
  if (!canViewPublicPage({ slug, status })) return null;
  const path = publicPagePath(slug);
  if (!path) return null;

  async function copyUrl() {
    try {
      await copyPublicPageUrl(slug);
      toast.success("Đã sao chép URL public.");
    } catch {
      toast.error("Không thể sao chép URL public.");
    }
  }

  return (
    <>
      <Button variant="outline" asChild>
        <Link href={path} target="_blank" rel="noreferrer">
          <ExternalLink /> Xem trang
        </Link>
      </Button>
      {showCopy ? (
        <Button type="button" variant="outline" onClick={() => void copyUrl()}>
          <Copy /> Sao chép URL
        </Button>
      ) : null}
    </>
  );
}
