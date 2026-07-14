"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import {
    BarChart3,
    Copy,
    Edit3,
    Link2,
    MoreVertical,
    QrCode,
    Trash2,
    Unplug,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import QRCode from "qrcode";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import {
    Credenza,
    CredenzaBody,
    CredenzaClose,
    CredenzaContent,
    CredenzaDescription,
    CredenzaFooter,
    CredenzaHeader,
    CredenzaTitle,
    CredenzaTrigger,
} from "@/components/ui/credenza";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import type { LinkDto } from "@/lib/api-client";
import SocialLinksGenerator from "@/features/link-creation/components/link-creator";

type LinkCardProps = {
    link: LinkDto;
};

type QrErrorCorrection = "L" | "M" | "Q" | "H";

export function LinkCard({ link }: LinkCardProps) {
    const t = useTranslations("LinkCard");
    const commonT = useTranslations("Common");
    const isActive = link.status === "active";
    const statusLabel = isActive
        ? t("active")
        : link.status === "inactive"
            ? commonT("inactive")
            : link.status === "paused"
                ? commonT("paused")
                : link.status;
    const shortUrl = `/l/${link.slug}`;
    const redirectUrl = useMemo(() => {
        if (typeof window === "undefined") {
            return shortUrl;
        }

        return new URL(shortUrl, window.location.origin).toString();
    }, [shortUrl]);

    const [qrSize, setQrSize] = useState(224);
    const [qrMargin, setQrMargin] = useState(1);
    const [qrErrorCorrection, setQrErrorCorrection] = useState<QrErrorCorrection>("M");
    const [qrForeground, setQrForeground] = useState("#111827");
    const [qrBackground, setQrBackground] = useState("#ffffff");
    const [qrImageSrc, setQrImageSrc] = useState("");
    const [isQrLoading, setIsQrLoading] = useState(false);
    const [editOpen, setEditOpen] = useState(false);

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

    const copyRedirectUrl = () => {
        void navigator.clipboard.writeText(redirectUrl).then(() => toast.success(t("copied")));
    };

    const handleDownloadQr = () => {
        if (!qrImageSrc) {
            toast.error(t("qrNotReady"));
            return;
        }

        const anchor = document.createElement("a");
        anchor.href = qrImageSrc;
        anchor.download = `${link.slug}-qr.png`;
        anchor.click();
    };

    return (
        <>
            <Card>
                <CardContent>
                    {/* Main information */}
                    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
                        {/* Link icon */}
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 sm:size-14">
                            <Link2
                                aria-hidden
                                className="size-6 text-slate-400 sm:size-7"
                                strokeWidth={2}
                            />
                        </div>

                        {/* Title, URLs and badges */}
                        <div className="min-w-0 flex-1">
                            <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                                <div className="min-w-0">
                                    <h3 className="truncate text-lg font-bold tracking-tight sm:text-xl">
                                        {link.title}
                                    </h3>

                                    <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 sm:text-sm">
                                        <span
                                            className="min-w-0 max-w-full truncate"
                                            title={link.destinationUrl ?? undefined}
                                        >
                                            {link.destinationUrl ?? "https://example.com"}
                                        </span>

                                        <span className="shrink-0 text-slate-400">
                                            {t("to")}
                                        </span>

                                        <button
                                            type="button"
                                            onClick={copyRedirectUrl}
                                            className="max-w-full truncate rounded-full bg-slate-100 px-2.5 py-0.5 font-mono text-xs font-medium text-slate-950 transition-colors hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                                            title={redirectUrl}
                                        >
                                            {redirectUrl}
                                        </button>
                                    </div>
                                </div>

                                {/* Status badges */}
                                <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
                                    <Badge
                                        variant="secondary"
                                        className={
                                            isActive
                                                ? "border-0 bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700"
                                                : "border-0 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600"
                                        }
                                    >
                                        {statusLabel}
                                    </Badge>

                                    <Badge
                                        variant="secondary"
                                        className="border-0 bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700"
                                    >
                                        {t("monetizationOn")}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom action bar */}
                    <div className="mt-4 flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50/60 p-2 sm:mt-4 sm:flex-row sm:items-center sm:justify-between sm:p-3 dark:bg-slate-800/60 dark:border-slate-700">
                        {/* Main actions */}
                        <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={copyRedirectUrl}
                                className="h-9 min-w-0 bg-white px-2 shadow-none sm:h-10 sm:px-3"
                            >
                                <Copy className="size-3.5 sm:size-4" />
                                <span className="hidden sm:inline">{t("copyLink")}</span>
                                <span className="sm:hidden">{t("copy")}</span>
                            </Button>

                            <Credenza>
                                <CredenzaTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-9 min-w-0 bg-white px-2 shadow-none sm:h-10 sm:px-3"
                                        aria-label={t("qrCode")}
                                    >
                                        <QrCode className="size-3.5 sm:size-4" />
                                        <span className="hidden sm:inline">{t("qrCode")}</span>
                                        <span className="sm:hidden">QR</span>
                                    </Button>
                                </CredenzaTrigger>

                                <CredenzaContent className="sm:max-w-xl">
                                    <CredenzaHeader>
                                        <CredenzaTitle>{t("qrCode")}</CredenzaTitle>
                                    </CredenzaHeader>

                                    <CredenzaBody className="space-y-4">
                                        <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <Field>
                                            <FieldLabel htmlFor={`qr-size-${link.id}`}>
                                                {t("qrSize")}
                                            </FieldLabel>

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
                                            <FieldLabel htmlFor={`qr-margin-${link.id}`}>
                                                {t("qrMargin")}
                                            </FieldLabel>

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
                                            <FieldLabel htmlFor={`qr-error-${link.id}`}>
                                                {t("errorCorrection")}
                                            </FieldLabel>

                                            <Select
                                                value={qrErrorCorrection}
                                                onValueChange={(value) =>
                                                    setQrErrorCorrection(value as QrErrorCorrection)
                                                }
                                            >
                                                <SelectTrigger
                                                    id={`qr-error-${link.id}`}
                                                    className="w-full"
                                                >
                                                    <SelectValue />
                                                </SelectTrigger>

                                                <SelectContent position="popper">
                                                    {(["L", "M", "Q", "H"] as QrErrorCorrection[]).map(
                                                        (value) => (
                                                            <SelectItem key={value} value={value}>
                                                                {value}
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </Field>

                                        <Field>
                                            <FieldLabel htmlFor={`qr-fg-${link.id}`}>
                                                {t("foregroundColor")}
                                            </FieldLabel>

                                            <Input
                                                id={`qr-fg-${link.id}`}
                                                value={qrForeground}
                                                type="color"
                                                className="h-10 w-full cursor-pointer p-1"
                                                onChange={(event) =>
                                                    setQrForeground(event.target.value)
                                                }
                                            />
                                        </Field>

                                        <Field>
                                            <FieldLabel htmlFor={`qr-bg-${link.id}`}>
                                                {t("backgroundColor")}
                                            </FieldLabel>

                                            <Input
                                                id={`qr-bg-${link.id}`}
                                                value={qrBackground}
                                                type="color"
                                                className="h-10 w-full cursor-pointer p-1"
                                                onChange={(event) =>
                                                    setQrBackground(event.target.value)
                                                }
                                            />
                                        </Field>
                                        </FieldGroup>

                                        <div className="flex min-h-64 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4">
                                        {qrImageSrc ? (
                                            <img
                                                alt="Generated QR code"
                                                className="size-56 max-w-full"
                                                src={qrImageSrc}
                                            />
                                        ) : (
                                            <p className="text-sm text-slate-500">
                                                {isQrLoading
                                                    ? t("generating")
                                                    : t("qrUnavailable")}
                                            </p>
                                        )}
                                        </div>
                                    </CredenzaBody>

                                    <CredenzaFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
                                        <CredenzaClose asChild>
                                            <Button variant="outline">
                                                {commonT("close")}
                                            </Button>
                                        </CredenzaClose>

                                        <div className="flex flex-col gap-2 sm:flex-row">
                                            <Button
                                                variant="outline"
                                                onClick={copyRedirectUrl}
                                            >
                                                {t("copyRedirectUrl")}
                                            </Button>

                                            <Button
                                                onClick={handleDownloadQr}
                                                disabled={!qrImageSrc || isQrLoading}
                                            >
                                                {t("downloadPng")}
                                            </Button>
                                        </div>
                                    </CredenzaFooter>
                                </CredenzaContent>
                            </Credenza>

                            <Credenza>
                                <CredenzaTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-9 min-w-0 bg-white px-2 shadow-none sm:h-10 sm:px-3"
                                        aria-label={t("stats")}
                                    >
                                        <BarChart3 className="size-3.5 sm:size-4" />
                                        <span className="hidden sm:inline">{t("stats")}</span>
                                    </Button>
                                </CredenzaTrigger>

                                <CredenzaContent className="sm:max-w-xl">
                                    <CredenzaHeader>
                                        <CredenzaTitle>{t("statsTitle")}</CredenzaTitle>
                                    </CredenzaHeader>

                                    <CredenzaBody className="space-y-4">
                                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                        {[
                                            [t("clicks"), "0"],
                                            [t("visitors"), "0"],
                                            [t("earnings"), "$0.0000"],
                                            [t("status"), statusLabel],
                                        ].map(([label, value]) => (
                                            <div
                                                key={label}
                                                className="rounded-lg border border-slate-200 bg-slate-50/70 p-3"
                                            >
                                                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                                                    {label}
                                                </p>

                                                <p className="mt-1 truncate text-lg font-semibold text-slate-950">
                                                    {value}
                                                </p>
                                            </div>
                                        ))}
                                        </div>

                                        <div className="space-y-4 rounded-xl border border-slate-200 p-4 text-sm">
                                        <div>
                                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                                {t("shortUrl")}
                                            </p>

                                            <p className="mt-1 break-all font-medium text-slate-950">
                                                {redirectUrl}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                                {t("destinationUrl")}
                                            </p>

                                            <p className="mt-1 break-all font-medium text-slate-950">
                                                {link.destinationUrl ?? "https://example.com"}
                                            </p>
                                        </div>
                                        </div>
                                    </CredenzaBody>

                                    <CredenzaFooter>
                                        <CredenzaClose asChild>
                                            <Button variant="outline">
                                                {commonT("close")}
                                            </Button>
                                        </CredenzaClose>
                                    </CredenzaFooter>
                                </CredenzaContent>
                            </Credenza>
                        </div>

                        {/* Monetization and menu */}
                        <div className="flex items-center justify-between gap-2 sm:justify-end">
                            <div className="flex h-9 flex-1 items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-2 sm:h-10 sm:flex-none sm:px-3 dark:bg-slate-800/60 dark:border-slate-700">
                                <Label
                                    htmlFor={`monetization-${link.id}`}
                                    className="cursor-pointer text-xs font-semibold text-slate-500"
                                >
                                    {t("monetization")}
                                </Label>

                                <Switch
                                    id={`monetization-${link.id}`}
                                    aria-label={t("monetization")}
                                />
                            </div>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="size-9 shrink-0 bg-white shadow-none sm:size-10"
                                        aria-label={t("edit")}
                                        title={t("edit")}
                                    >
                                        <MoreVertical className="size-4" />
                                    </Button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent align="end" className="w-52">
                                    <DropdownMenuItem
                                        onSelect={(event) => {
                                            event.preventDefault();
                                            setEditOpen(true);
                                        }}
                                    >
                                        <Edit3 className="size-4" />
                                        {t("edit")}
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator />

                                    <DropdownMenuItem className="text-orange-600 focus:text-orange-700">
                                        <Unplug className="size-4" />
                                        {t("deactivate")}
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator />

                                    <DropdownMenuItem className="text-destructive focus:text-destructive">
                                        <Trash2 className="size-4" />
                                        {t("delete")}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Credenza open={editOpen} onOpenChange={setEditOpen}>
                <CredenzaContent className="sm:max-w-6xl">
                    <CredenzaHeader>
                        <CredenzaTitle>{t("editTitle")}</CredenzaTitle>
                    </CredenzaHeader>
                    <CredenzaBody className="px-4 sm:px-6">
                        <SocialLinksGenerator embedded initialLink={link} onSaved={() => setEditOpen(false)} />
                    </CredenzaBody>
                    <CredenzaFooter>
                        <CredenzaClose asChild>
                            <Button variant="outline">{commonT("close")}</Button>
                        </CredenzaClose>
                    </CredenzaFooter>
                </CredenzaContent>
            </Credenza>
        </>
    );
}
