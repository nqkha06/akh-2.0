"use client";
/* eslint-disable @next/next/no-img-element */

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
import { Switch } from "@/components/ui/switch"

type LinkCardProps = {
    link: LinkDto;
};

export function LinkCard({ link }: LinkCardProps) {
    const isActive = link.status === "active";
    const shortUrl = `/l/${link.slug}`;

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
                                        <FieldLabel htmlFor="fieldgroup-name">QR size</FieldLabel>
                                        <Input defaultValue="100" type="number" />
                                    </Field>
                                    <Field>
                                        <FieldLabel htmlFor="fieldgroup-name">QR margin</FieldLabel>
                                        <Input defaultValue="1" type="number" />
                                    </Field>
                                    <Field>
                                        <FieldLabel htmlFor="fieldgroup-name">Error corretion</FieldLabel>
                                        <Input defaultValue="L" type="text" />
                                    </Field>

                                    <Field>
                                        <FieldLabel htmlFor="fieldgroup-name">Foreground Color</FieldLabel>
                                        <Input placeholder="" type="color" />
                                    </Field>
                                    <Field>
                                        <FieldLabel htmlFor="fieldgroup-name">Background Color</FieldLabel>
                                        <Input placeholder="" type="color" />
                                    </Field>
                                    
                                </FieldGroup>
                                <div className="border-border bg-background flex justify-center rounded-xl border p-4">
                                    <img alt="Generated QR code" className="h-56 w-56" src="data:image/png;base64,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"></img>
                                </div>
                               <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <Button variant="outline">Close</Button>

                                    <div className="flex flex-col gap-2 sm:flex-row">
                                        <DialogClose asChild>
                                        <Button variant="outline">Copy Redirect URL</Button>
                                        </DialogClose>

                                        <Button variant="default">Download PNG</Button>
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
