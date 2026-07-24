"use client"
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react"
import QRCode from "qrcode"
import { Copy, Download } from "lucide-react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { BioPageDto } from "@/lib/api-client"
import { getBioCtr, getVisibleBioLinks } from "./types"

type QrErrorCorrection = "L" | "M" | "Q" | "H"

function absolutePublicUrl(page: BioPageDto) {
  if (typeof window === "undefined") return page.publicUrl
  return new URL(page.publicUrl, window.location.origin).toString()
}

export async function copyBioUrl(page: BioPageDto) {
  try {
    await navigator.clipboard.writeText(absolutePublicUrl(page))
    toast.success("Đã sao chép liên kết")
  } catch {
    toast.error("Không thể sao chép liên kết")
  }
}

export function LinkInBioQrDialog({ page, open, onOpenChange }: { page: BioPageDto; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [size, setSize] = useState(224)
  const [margin, setMargin] = useState(1)
  const [errorCorrection, setErrorCorrection] = useState<QrErrorCorrection>("M")
  const [imageSrc, setImageSrc] = useState("")
  const publicUrl = absolutePublicUrl(page)

  useEffect(() => {
    if (!open) return
    let active = true
    void QRCode.toDataURL(publicUrl, {
      width: size,
      margin,
      errorCorrectionLevel: errorCorrection,
      color: { dark: "#111827", light: "#ffffff" },
    }).then((value) => active && setImageSrc(value)).catch(() => active && setImageSrc(""))
    return () => { active = false }
  }, [errorCorrection, margin, open, publicUrl, size])

  const downloadQr = () => {
    if (!imageSrc) return
    const download = document.createElement("a")
    download.href = imageSrc
    download.download = `${page.slug}-qr.png`
    download.click()
  }

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaContent className="sm:max-w-xl">
        <CredenzaHeader className="border-b border-border">
          <CredenzaTitle>Mã QR</CredenzaTitle>
          <CredenzaDescription>Tạo mã QR cho trang {page.name}.</CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody className="space-y-5 pt-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2"><Label htmlFor={`bio-qr-size-${page.id}`}>Kích thước</Label><Input id={`bio-qr-size-${page.id}`} type="number" min={120} max={640} value={size} onChange={(event) => setSize(Math.min(640, Math.max(120, Number(event.target.value) || 224)))} /></div>
            <div className="grid gap-2"><Label htmlFor={`bio-qr-margin-${page.id}`}>Viền</Label><Input id={`bio-qr-margin-${page.id}`} type="number" min={0} max={20} value={margin} onChange={(event) => setMargin(Math.min(20, Math.max(0, Number(event.target.value) || 0)))} /></div>
            <div className="grid gap-2"><Label>Mức sửa lỗi</Label><Select value={errorCorrection} onValueChange={(value) => setErrorCorrection(value as QrErrorCorrection)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(["L", "M", "Q", "H"] as QrErrorCorrection[]).map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div className="flex min-h-64 items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 p-4">{imageSrc ? <img src={imageSrc} alt={`Mã QR của ${page.name}`} className="size-56 max-w-full" /> : <p className="text-sm text-muted-foreground">Không thể tạo mã QR.</p>}</div>
          <p className="break-all rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">{publicUrl}</p>
        </CredenzaBody>
        <CredenzaFooter className="flex-col gap-2 border-border bg-background sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => void copyBioUrl(page)}><Copy className="size-4" />Sao chép liên kết</Button>
          <Button onClick={downloadQr} disabled={!imageSrc}><Download className="size-4" />Tải PNG</Button>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  )
}

export function LinkInBioStatsDialog({ page, open, onOpenChange }: { page: BioPageDto; open: boolean; onOpenChange: (open: boolean) => void }) {
  const ctr = getBioCtr(page)
  const rows = [
    ["Lượt xem", page.views.toLocaleString("vi-VN")],
    ["Lượt nhấp", page.clicks.toLocaleString("vi-VN")],
    ["Tỷ lệ nhấp", `${ctr.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%`],
    ["Liên kết công khai", getVisibleBioLinks(page).toLocaleString("vi-VN")],
    ["Mạng xã hội", page.socialLinks.length.toLocaleString("vi-VN")],
    ["Widget", page.widgets.length.toLocaleString("vi-VN")],
  ]

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaContent className="sm:max-w-lg">
        <CredenzaHeader className="border-b border-border"><CredenzaTitle>Thống kê</CredenzaTitle><CredenzaDescription>Hiệu suất hiện tại của {page.name}.</CredenzaDescription></CredenzaHeader>
        <CredenzaBody className="pt-4">
          <dl className="divide-y divide-border rounded-xl border border-border">
            {rows.map(([label, value]) => <div key={label} className="flex items-center justify-between gap-4 px-4 py-3 text-sm"><dt className="text-muted-foreground">{label}</dt><dd className="font-semibold tabular-nums text-foreground">{value}</dd></div>)}
          </dl>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  )
}

export function DeleteLinkInBioDialog({ page, open, onOpenChange, onConfirm }: { page: BioPageDto; open: boolean; onOpenChange: (open: boolean) => void; onConfirm: () => Promise<void> }) {
  const [deleting, setDeleting] = useState(false)
  const confirmDelete = async () => {
    if (deleting) return
    setDeleting(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa trang “{page.name}”?</AlertDialogTitle>
          <AlertDialogDescription>Trang sẽ ngừng hiển thị công khai và được chuyển vào trạng thái đã xóa.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Hủy</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={deleting} onClick={(event) => { event.preventDefault(); void confirmDelete() }}>{deleting ? "Đang xóa..." : "Xóa"}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
