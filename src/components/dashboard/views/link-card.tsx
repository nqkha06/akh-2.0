"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Copy, BarChart3, Edit3, MoreVertical, QrCode, Trash2, Unplug } from "lucide-react";
import { toast } from "sonner";
import type { LinkDto } from "@/lib/api-client";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import QRCode from "qrcode";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type LinkCardProps = {
    link: LinkDto;
};

export function LinkCard({ link }: LinkCardProps) {
    const isActive = link.status === "active";
    const shortUrl = `/l/${link.slug}`;
    const redirectUrl = useMemo(() => {
        if (typeof window === "undefined") {
            return shortUrl;
        }
        return new URL(shortUrl, window.location.origin).toString();
    }, [shortUrl]);

    const [qrSize, setQrSize] = useState(224);
    const [qrMargin, setQrMargin] = useState(1);
    const [qrErrorCorrection, setQrErrorCorrection] = useState<"L" | "M" | "Q" | "H">("M");
    const [qrForeground, setQrForeground] = useState("#111827");
    const [qrBackground, setQrBackground] = useState("#ffffff");
    const [qrImageSrc, setQrImageSrc] = useState("");
    const [isQrLoading, setIsQrLoading] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const generateQr = async () => {
            try {
                setIsQrLoading(true);
                const dataUrl = await QRCode.toDataURL(redirectUrl, {
                    width: qrSize,
                    margin: qrMargin,
                    errorCorrectionLevel: qrErrorCorrection,
                    color: {
                        dark: qrForeground,
                        light: qrBackground,
                    },
                });
                if (isMounted) {
                    setQrImageSrc(dataUrl);
                }
            } catch {
                if (isMounted) {
                    setQrImageSrc("");
                }
            } finally {
                if (isMounted) {
                    setIsQrLoading(false);
                }
            }
        };

        void generateQr();

        return () => {
            isMounted = false;
        };
    }, [redirectUrl, qrSize, qrMargin, qrErrorCorrection, qrForeground, qrBackground]);

    const handleDownloadQr = () => {
        if (!qrImageSrc) {
            toast.error("QR code chưa sẵn sàng");
            return;
        }

        const anchor = document.createElement("a");
        anchor.href = qrImageSrc;
        anchor.download = `${link.slug}-qr.png`;
        anchor.click();
    };

    return (
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-xl font-black tracking-tight text-slate-950">
                            {link.title}
                        </h3>

                        <span
                            className={[
                                "inline-flex items-center rounded-full px-3 py-1 text-xs font-black",
                                isActive ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500",
                            ].join(" ")}
                        >
                            {isActive ? "Active" : link.status}
                        </span>

                        <span className="inline-flex items-center rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-600">
                            Monetization On
                        </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-medium text-slate-500">
                        <span className="max-w-full truncate">
                            {link.destinationUrl ?? "https://example.com"}
                        </span>

                        <span className="text-slate-400">to</span>

                        <button
                            type="button"
                            onClick={() => void navigator.clipboard.writeText(shortUrl).then(() => toast.success("Sao chép đường dẫn ngắn"))}
                            className="inline-flex items-center rounded-xl bg-slate-100 px-3 py-1.5 text-sm font-black text-slate-950 transition hover:bg-slate-200"
                        >
                            {shortUrl}
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-3">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={() => void navigator.clipboard.writeText(shortUrl).then(() => toast.success("Đã sao chép"))}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-950 shadow-sm transition hover:border-blue-200 hover:text-blue-600"
                        >
                            <Copy size={18} />
                            Copy Link
                        </button>

                        <Dialog>
                            <DialogTrigger asChild>
                                <button
                                    type="button"
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-950 shadow-sm transition hover:border-blue-200 hover:text-blue-600"
                                >
                                    <QrCode size={18} />
                                    QR Code
                                </button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-xl">
                                <DialogHeader>
                                    <DialogTitle>QR Code</DialogTitle>
                                    <DialogDescription>
                                        Scan the QR code to access the link.
                                    </DialogDescription>
                                </DialogHeader>
                                <FieldGroup className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <Field>
                                        <FieldLabel htmlFor={`qr-size-${link.id}`}>QR size</FieldLabel>
                                        <Input
                                            id={`qr-size-${link.id}`}
                                            min={120}
                                            max={1024}
                                            value={qrSize}
                                            type="number"
                                            onChange={(event) => {
                                                const next = Number(event.target.value);
                                                if (!Number.isNaN(next)) {
                                                    setQrSize(Math.min(1024, Math.max(120, next)));
                                                }
                                            }}
                                        />
                                    </Field>
                                    <Field>
                                        <FieldLabel htmlFor={`qr-margin-${link.id}`}>QR margin</FieldLabel>
                                        <Input
                                            id={`qr-margin-${link.id}`}
                                            min={0}
                                            max={20}
                                            value={qrMargin}
                                            type="number"
                                            onChange={(event) => {
                                                const next = Number(event.target.value);
                                                if (!Number.isNaN(next)) {
                                                    setQrMargin(Math.min(20, Math.max(0, next)));
                                                }
                                            }}
                                        />
                                    </Field>
                                    <Field>
                                        <FieldLabel htmlFor={`qr-error-${link.id}`}>Error correction</FieldLabel>
                                        <Select defaultValue="L">
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent
                                                position={"popper" /* Use popper for better positioning with the dialog */}
                                            >
                                                <SelectGroup>
                                                    <SelectItem value="L">L</SelectItem>
                                                    <SelectItem value="M">M</SelectItem>
                                                    <SelectItem value="Q">Q</SelectItem>
                                                    <SelectItem value="H">H</SelectItem>
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                       
                                    </Field>

                                    <Field>
                                        <FieldLabel htmlFor={`qr-fg-${link.id}`}>Foreground Color</FieldLabel>
                                        <Input
                                            id={`qr-fg-${link.id}`}
                                            value={qrForeground}
                                            type="color"
                                            onChange={(event) => setQrForeground(event.target.value)}
                                        />
                                    </Field>
                                    <Field>
                                        <FieldLabel htmlFor={`qr-bg-${link.id}`}>Background Color</FieldLabel>
                                        <Input
                                            id={`qr-bg-${link.id}`}
                                            value={qrBackground}
                                            type="color"
                                            onChange={(event) => setQrBackground(event.target.value)}
                                        />
                                    </Field>

                                </FieldGroup>
                                <div className="border-border bg-background flex justify-center rounded-xl border p-4">
                                    {qrImageSrc ? (
                                        <img
                                            alt="Generated QR code"
                                            className="h-56 w-56"
                                            src={qrImageSrc}
                                        />
                                    ) : (
                                        <div className="flex h-56 w-56 items-center justify-center text-sm text-slate-500">
                                            {isQrLoading ? "Generating..." : "Unable to generate QR code"}
                                        </div>
                                    )}
                                </div>
                                <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <DialogClose asChild>
                                        <Button variant="outline">Close</Button>
                                    </DialogClose>

                                    <div className="flex flex-col gap-2 sm:flex-row">
                                        <DialogClose asChild>
                                            <Button
                                                variant="outline"
                                                onClick={() => void navigator.clipboard.writeText(redirectUrl).then(() => toast.success("Đã sao chép redirect URL"))}
                                            >
                                                Copy Redirect URL
                                            </Button>
                                        </DialogClose>

                                        <Button variant="default" onClick={handleDownloadQr} disabled={!qrImageSrc || isQrLoading}>
                                            Download PNG
                                        </Button>
                                    </div>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        <Dialog>
                            <DialogTrigger asChild>
                                <button
                                    type="button"
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-950 shadow-sm transition hover:border-blue-200 hover:text-blue-600"
                                >
                                    <BarChart3 size={18} />
                                    Stats
                                </button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-xl">
                                <DialogHeader>
                                    <DialogTitle>Link Statistics</DialogTitle>
                                    <DialogDescription>
                                        Performance snapshot for demo over All Time.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
                                    <div className="border-border bg-background rounded-xl border p-3">
                                        <p className="text-muted-foreground text-[10px] font-medium uppercase">
                                            Clicks
                                        </p>
                                        <p className="mt-1 text-lg font-semibold">0</p>
                                    </div>
                                    <div className="border-border bg-background rounded-xl border p-3">
                                        <p className="text-muted-foreground text-[10px] font-medium uppercase">
                                            Visitors
                                        </p>
                                        <p className="mt-1 text-lg font-semibold">0</p>
                                    </div>
                                    <div className="border-border bg-background rounded-xl border p-3">
                                        <p className="text-muted-foreground text-[10px] font-medium uppercase">
                                            Earnings
                                        </p>
                                        <p className="mt-1 text-lg font-semibold">$0.0000</p>
                                    </div>
                                    <div className="border-border bg-background rounded-xl border p-3">
                                        <p className="text-muted-foreground text-[10px] font-medium uppercase">
                                            Status
                                        </p>
                                        <p className="mt-1 text-lg font-semibold">Active</p>
                                    </div>
                                </div>
                                <div className="border-border bg-background space-y-3 rounded-xl border p-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground text-xs uppercase">
                                            Short URL
                                        </p>
                                        <p className="mt-1 break-all font-medium">{shortUrl}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs uppercase">
                                            Destination URL
                                        </p>
                                        <p className="mt-1 break-all font-medium">
                                            https://www.youtube.com/watch?v=3EEnvO0yMHY
                                        </p>
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div>
                                            <p className="text-muted-foreground text-xs uppercase">
                                                Created
                                            </p>
                                            <p className="mt-1 font-medium">5/9/2026, 10:25:54 PM</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground text-xs uppercase">
                                                Last Updated
                                            </p>
                                            <p className="mt-1 font-medium">6/1/2026, 12:52:26 AM</p>
                                        </div>
                                    </div>
                                </div>

                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button variant="outline">Close</Button>
                                    </DialogClose>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="flex items-center gap-3">
                        <div
                            className="inline-flex h-11 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-500"
                        >
                            Monetization
                            <Switch />
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    className="inline-flex size-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm transition hover:border-slate-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
                                >
                                    <MoreVertical size={20} />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="w-56 rounded-2xl border border-slate-200 bg-white p-0 shadow-[0_18px_45px_rgba(15,23,42,0.16)]"
                            >
                                <DropdownMenuItem className="flex w-full cursor-pointer items-center gap-3 px-5 py-4 text-base font-bold text-slate-950 transition hover:bg-slate-50 focus:bg-slate-50 focus:text-slate-950">
                                    <Edit3 size={19} />
                                    Edit
                                </DropdownMenuItem>
                                <div className="h-px bg-slate-100" />
                                <DropdownMenuItem className="flex w-full cursor-pointer items-center gap-3 px-5 py-4 text-base font-bold text-orange-600 transition hover:bg-orange-50 focus:bg-orange-50 focus:text-orange-600">
                                    <Unplug size={19} />
                                    Deactivate
                                </DropdownMenuItem>
                                <div className="h-px bg-slate-100" />
                                <DropdownMenuItem className="flex w-full cursor-pointer items-center gap-3 px-5 py-4 text-base font-bold text-red-600 transition hover:bg-red-50 focus:bg-red-50 focus:text-red-600">
                                    <Trash2 size={19} />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        </article>
    );
}
