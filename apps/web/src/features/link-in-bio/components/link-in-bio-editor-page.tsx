"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, CircleAlert, ExternalLink, LoaderCircle } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { PageContainer } from "@/components/dashboard/ui"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { BioPageDto } from "@/lib/api-client"

import LinkInBioGenerator from "./link-in-bio-generator"

export function LinkInBioEditorPage({ mode, initialBio }: { mode: "create" | "edit"; initialBio?: BioPageDto }) {
  const editing = mode === "edit"
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()
  const title = editing ? "Chỉnh sửa trang Link-in-bio" : "Tạo trang Link-in-bio"
  const breadcrumbCurrent = editing ? "Chỉnh sửa" : "Tạo trang"
  const description = editing
    ? "Cập nhật hồ sơ, liên kết và giao diện cho trang công khai của bạn."
    : "Thiết lập hồ sơ, liên kết và giao diện cho trang công khai của bạn."

  return <PageContainer size="wide">
    <Breadcrumb className="text-[13px] sm:text-sm">
      <BreadcrumbList className="gap-1.5 sm:gap-2.5">
        <BreadcrumbItem className="hidden sm:inline-flex"><BreadcrumbLink asChild><Link href="/member">Home</Link></BreadcrumbLink></BreadcrumbItem>
        <BreadcrumbSeparator className="hidden sm:block" />
        <BreadcrumbItem><BreadcrumbLink asChild><Link href="/member/bio">Link-in-bio</Link></BreadcrumbLink></BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem><BreadcrumbPage>{breadcrumbCurrent}</BreadcrumbPage></BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>

    <div className="border-b border-border pb-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-2.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="ghost" size="icon" className="mt-0.5 size-11 shrink-0 sm:size-9" aria-label="Quay lại Link-in-bio" onClick={() => router.push("/member/bio")}>
                <ArrowLeft className="size-[18px]" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Quay lại Link-in-bio</TooltipContent>
          </Tooltip>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-[-0.025em] text-foreground sm:text-[1.75rem]">{title}</h1>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:pt-0.5">
          <Button type="button" variant="ghost" size="sm" className="h-10 sm:h-9" onClick={() => router.push("/member/bio")}>Hủy</Button>
          {!editing ? <Button type="submit" form="link-in-bio-editor-form" name="saveMode" value="draft" variant="outline" size="sm" disabled={isSaving} className="h-10 sm:h-9">Lưu nháp</Button> : null}
          {editing && initialBio?.publicUrl ? <Button asChild variant="outline" size="sm" className="h-10 sm:h-9"><Link href={initialBio.publicUrl} target="_blank" rel="noreferrer">Xem trang<ExternalLink /></Link></Button> : null}
          <Button type="submit" form="link-in-bio-editor-form" name="saveMode" value={editing ? "current" : "published"} size="sm" disabled={isSaving} className="h-10 sm:h-9">
            {isSaving ? <><LoaderCircle className="animate-spin motion-reduce:animate-none" />Đang lưu…</> : editing ? "Lưu thay đổi" : "Xuất bản"}
          </Button>
        </div>
      </div>
    </div>

    <LinkInBioGenerator key={initialBio?.id || "create-bio"} initialBio={initialBio} onSavingChange={setIsSaving} />
  </PageContainer>
}

export function LinkInBioEditorLoading() {
  return <PageContainer size="wide"><div className="border-b border-border pb-5"><Skeleton className="mb-3 h-5 w-48" /><Skeleton className="h-8 w-72" /><Skeleton className="mt-2 h-4 w-[34rem] max-w-full" /></div><div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]"><div className="space-y-3"><Skeleton className="h-16 rounded-xl" /><Skeleton className="h-16 rounded-xl" /><Skeleton className="h-16 rounded-xl" /><Skeleton className="h-16 rounded-xl" /></div><Skeleton className="h-[700px] rounded-xl" /></div></PageContainer>
}

export function LinkInBioEditorError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <PageContainer size="wide"><Button asChild variant="ghost" size="icon" className="size-11 sm:size-9" aria-label="Quay lại Link-in-bio"><Link href="/member/bio"><ArrowLeft /></Link></Button><Alert variant="destructive"><CircleAlert /><AlertTitle>Không tải được trang Link-in-bio</AlertTitle><AlertDescription><p>{message}</p><Button variant="outline" className="mt-3 bg-background" onClick={onRetry}><LoaderCircle />Thử lại</Button></AlertDescription></Alert></PageContainer>
}
