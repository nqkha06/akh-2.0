"use client";

import {
  ChevronDown,
  Eye,
  EyeOff,
  GripVertical,
  Images,
  Landmark,
  Link2,
  Plus,
  Share2,
  SeparatorHorizontal,
  Trash2,
} from "lucide-react";
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sortable, SortableContent, SortableItem, SortableItemHandle } from "@/components/ui/sortable";
import { GalleryBlockEditor } from "@/features/link-in-bio/gallery/gallery-block-editor";
import { BankDetailsBlockEditor } from "./bank-details-block-editor";
import { DividerBlockEditor } from "./divider-block-editor";
import {
  contentOrderKey,
  createGalleryBlock,
  normalizeContentOrder,
} from "@/features/link-in-bio/gallery/gallery-types";
import { generateId } from "@/lib/id";
import type {
  BioBankDetailsBlockDto,
  BioContentOrderItemDto,
  BioCustomLinkDto,
  BioDividerBlockDto,
  BioGalleryBlockDto,
  BioSocialLinkDto,
  BioWidgetDto,
} from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { ContentBlockPickerDialog } from "./content-block-picker-dialog";
import { LinkAnimationPicker } from "./link-animation-picker";
import {
  getContentBlockDefinition,
  type ContentBlockPickerType,
} from "./content-block-registry";
import { createBankDetailsBlock, createDividerBlock } from "./simple-content-types";

const socialPlatforms = [
  "Instagram", "Twitter", "Facebook", "TikTok", "YouTube", "LinkedIn", "PayPal", "Venmo",
  "CashApp", "Spotify", "Apple Music", "Reddit", "Discord", "Twitch",
];

function focusBlockField(id: string) {
  window.setTimeout(() => document.getElementById(id)?.focus(), 0);
}

export function ContentSection({
  customLinks,
  socialLinks,
  widgets,
  galleries,
  dividers,
  bankDetails,
  hiddenLinks,
  contentOrder,
  disabled,
  onCustomLinksChange,
  onSocialLinksChange,
  onWidgetsChange,
  onGalleriesChange,
  onDividersChange,
  onBankDetailsChange,
  onHiddenLinksChange,
  onContentOrderChange,
}: {
  customLinks: BioCustomLinkDto[];
  socialLinks: BioSocialLinkDto[];
  widgets: BioWidgetDto[];
  galleries: BioGalleryBlockDto[];
  dividers: BioDividerBlockDto[];
  bankDetails: BioBankDetailsBlockDto[];
  hiddenLinks: string[];
  contentOrder: BioContentOrderItemDto[];
  disabled?: boolean;
  onCustomLinksChange: (links: BioCustomLinkDto[]) => void;
  onSocialLinksChange: (links: BioSocialLinkDto[]) => void;
  onWidgetsChange: (widgets: BioWidgetDto[]) => void;
  onGalleriesChange: (galleries: BioGalleryBlockDto[]) => void;
  onDividersChange: (dividers: BioDividerBlockDto[]) => void;
  onBankDetailsChange: (bankDetails: BioBankDetailsBlockDto[]) => void;
  onHiddenLinksChange: (ids: string[]) => void;
  onContentOrderChange: (order: BioContentOrderItemDto[]) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<BioContentOrderItemDto | null>(null);
  const normalizedOrder = normalizeContentOrder(contentOrder, {
    socials: socialLinks,
    widgets,
    galleries,
    dividers,
    bankDetails,
    links: customLinks,
  });

  function appendOrder(item: BioContentOrderItemDto) {
    onContentOrderChange([...normalizedOrder, item]);
    setExpandedKey(contentOrderKey(item));
  }

  function addBlock(type: ContentBlockPickerType) {
    if (type === "link") {
      const id = `link-${generateId({ length: 10 })}`;
      onCustomLinksChange([...customLinks, { id, title: "", url: "", animationEffect: "none" }]);
      appendOrder({ type: "link", id });
      focusBlockField(`content-link-title-${id}`);
      return;
    }
    if (type === "gallery") {
      const gallery = createGalleryBlock(`gallery-${generateId({ length: 10 })}`);
      onGalleriesChange([...galleries, gallery]);
      appendOrder({ type: "gallery", id: gallery.id });
      focusBlockField(`gallery-title-${gallery.id}`);
      return;
    }
    if (type === "social") {
      if (socialLinks.length) return;
      const id = `social-${generateId({ length: 10 })}`;
      onSocialLinksChange([{ id, platform: "Instagram", url: "", enabled: true }]);
      appendOrder({ type: "social", id: "socials" });
      focusBlockField(`content-social-url-${id}`);
      return;
    }
    if (type === "divider") {
      const block = createDividerBlock(`divider-${generateId({ length: 10 })}`);
      onDividersChange([...dividers, block]);
      appendOrder({ type: "divider", id: block.id });
      return;
    }
    if (type === "bank-details") {
      const block = createBankDetailsBlock(`bank-${generateId({ length: 10 })}`);
      onBankDetailsChange([...bankDetails, block]);
      appendOrder({ type: "bank-details", id: block.id });
      focusBlockField(`bank-name-${block.id}`);
      return;
    }
    const id = `widget-${generateId({ length: 10 })}`;
    onWidgetsChange([...widgets, { id, type, title: "", url: "", description: "", enabled: true }]);
    appendOrder({ type: "widget", id });
    focusBlockField(`content-widget-title-${id}`);
  }

  function updateLink(id: string, patch: Partial<BioCustomLinkDto>) {
    onCustomLinksChange(customLinks.map((link) => link.id === id ? { ...link, ...patch } : link));
  }

  function updateWidget(id: string, patch: Partial<BioWidgetDto>) {
    onWidgetsChange(widgets.map((widget) => widget.id === id ? { ...widget, ...patch } : widget));
  }

  function updateGallery(nextGallery: BioGalleryBlockDto) {
    onGalleriesChange(galleries.map((gallery) => gallery.id === nextGallery.id ? nextGallery : gallery));
  }

  function updateDivider(nextBlock: BioDividerBlockDto) {
    onDividersChange(dividers.map((block) => block.id === nextBlock.id ? nextBlock : block));
  }

  function updateBankDetails(nextBlock: BioBankDetailsBlockDto) {
    onBankDetailsChange(bankDetails.map((block) => block.id === nextBlock.id ? nextBlock : block));
  }

  function removeSocial(id: string) {
    const remaining = socialLinks.filter((social) => social.id !== id);
    onSocialLinksChange(remaining);
    if (remaining.length === 0) {
      onContentOrderChange(normalizedOrder.filter((item) => item.type !== "social"));
      setExpandedKey(null);
    }
  }

  function toggleVisibility(item: BioContentOrderItemDto, checked: boolean) {
    if (item.type === "link") {
      onHiddenLinksChange(checked ? hiddenLinks.filter((id) => id !== item.id) : [...hiddenLinks, item.id]);
    } else if (item.type === "gallery") {
      const gallery = galleries.find((entry) => entry.id === item.id);
      if (gallery) updateGallery({ ...gallery, enabled: checked });
    } else if (item.type === "widget") {
      updateWidget(item.id, { enabled: checked });
    } else if (item.type === "social") {
      onSocialLinksChange(socialLinks.map((social) => ({ ...social, enabled: checked })));
    } else if (item.type === "divider") {
      const block = dividers.find((entry) => entry.id === item.id);
      if (block) updateDivider({ ...block, enabled: checked });
    } else {
      const block = bankDetails.find((entry) => entry.id === item.id);
      if (block) updateBankDetails({ ...block, enabled: checked });
    }
  }

  function deleteBlock(item: BioContentOrderItemDto) {
    if (item.type === "link") {
      onCustomLinksChange(customLinks.filter((link) => link.id !== item.id));
      onHiddenLinksChange(hiddenLinks.filter((id) => id !== item.id));
    } else if (item.type === "gallery") {
      onGalleriesChange(galleries.filter((gallery) => gallery.id !== item.id));
    } else if (item.type === "widget") {
      onWidgetsChange(widgets.filter((widget) => widget.id !== item.id));
    } else if (item.type === "social") {
      onSocialLinksChange([]);
    } else if (item.type === "divider") {
      onDividersChange(dividers.filter((block) => block.id !== item.id));
    } else {
      onBankDetailsChange(bankDetails.filter((block) => block.id !== item.id));
    }
    onContentOrderChange(normalizedOrder.filter((entry) => contentOrderKey(entry) !== contentOrderKey(item)));
    if (expandedKey === contentOrderKey(item)) setExpandedKey(null);
    setPendingDelete(null);
  }

  function blockMeta(item: BioContentOrderItemDto) {
    if (item.type === "link") {
      const link = customLinks.find((entry) => entry.id === item.id);
      return { icon: Link2, title: link?.title || "Liên kết chưa đặt tên", summary: link?.url || "Chưa có URL", visible: !hiddenLinks.includes(item.id) };
    }
    if (item.type === "gallery") {
      const gallery = galleries.find((entry) => entry.id === item.id);
      return { icon: Images, title: gallery?.title || "Bộ sưu tập chưa đặt tên", summary: `${gallery?.images.length || 0} ảnh · ${gallery?.displayMode === "slider" ? "Slider" : "Grid"}`, visible: gallery?.enabled !== false };
    }
    if (item.type === "social") {
      return { icon: Share2, title: "Mạng xã hội", summary: `${socialLinks.length} hồ sơ`, visible: socialLinks.some((social) => social.enabled !== false) };
    }
    if (item.type === "divider") {
      const block = dividers.find((entry) => entry.id === item.id);
      return { icon: SeparatorHorizontal, title: block?.label || "Dấu phân cách", summary: block?.showLabel && block.label ? "Có nhãn" : "Đường phân cách", visible: block?.enabled !== false };
    }
    if (item.type === "bank-details") {
      const block = bankDetails.find((entry) => entry.id === item.id);
      return { icon: Landmark, title: block?.title || "Thông tin ngân hàng", summary: block?.bankName || "Chưa nhập ngân hàng", visible: block?.enabled !== false };
    }
    const widget = widgets.find((entry) => entry.id === item.id);
    const definition = widget ? getContentBlockDefinition(widget.type as ContentBlockPickerType) : undefined;
    return { icon: definition?.icon || Link2, title: widget?.title || definition?.title || "Nội dung nhúng", summary: definition?.title || widget?.type || "Widget", visible: widget?.enabled !== false };
  }

  return (
    <>
      {normalizedOrder.length ? (
        <Sortable value={normalizedOrder} getItemValue={contentOrderKey} onValueChange={onContentOrderChange} orientation="vertical">
          <SortableContent className="space-y-2">
            {normalizedOrder.map((item) => {
              const key = contentOrderKey(item);
              const meta = blockMeta(item);
              const Icon = meta.icon;
              const open = expandedKey === key;
              return (
                <SortableItem key={key} value={key} disabled={disabled} className="overflow-hidden rounded-lg border border-border bg-background">
                  <Collapsible open={open} onOpenChange={(nextOpen) => setExpandedKey(nextOpen ? key : null)}>
                    <div className="flex min-h-13 items-center gap-1.5 px-2 py-2">
                      <SortableItemHandle disabled={disabled} className="grid size-9 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-accent" aria-label={`Kéo để sắp xếp ${meta.title}`}><GripVertical className="size-4" /></SortableItemHandle>
                      <button type="button" className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md px-1 py-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => setExpandedKey(open ? null : key)} aria-expanded={open}>
                        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground"><Icon className="size-4" /></span>
                        <span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-foreground">{meta.title}</span><span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{meta.summary}</span></span>
                      </button>
                      <Button type="button" variant="ghost" size="icon-sm" disabled={disabled} onClick={() => toggleVisibility(item, !meta.visible)} aria-label={meta.visible ? `Ẩn ${meta.title}` : `Hiện ${meta.title}`} className="text-muted-foreground">{meta.visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}</Button>
                      {item.type === "link" ? <LinkAnimationPicker effect={customLinks.find((link) => link.id === item.id)?.animationEffect} disabled={disabled} onChange={(animationEffect) => updateLink(item.id, { animationEffect })} /> : null}
                      <Button type="button" variant="ghost" size="icon-sm" disabled={disabled} onClick={() => setPendingDelete(item)} aria-label={`Xóa ${meta.title}`} className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="size-4" /></Button>
                      <Button type="button" variant="ghost" size="icon-sm" onClick={() => setExpandedKey(open ? null : key)} aria-label={open ? `Thu gọn ${meta.title}` : `Chỉnh sửa ${meta.title}`}><ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} /></Button>
                    </div>
                    <CollapsibleContent>
                      <div className="border-t border-border bg-muted/10 p-3 sm:p-4">
                        {item.type === "link" ? (() => {
                          const link = customLinks.find((entry) => entry.id === item.id);
                          return link ? <div className="grid gap-3 sm:grid-cols-2"><div className="grid gap-2"><Label htmlFor={`content-link-title-${link.id}`}>Tiêu đề</Label><Input disabled={disabled} id={`content-link-title-${link.id}`} value={link.title} onChange={(event) => updateLink(link.id, { title: event.target.value })} placeholder="Shop ở đây" /></div><div className="grid gap-2"><Label htmlFor={`content-link-url-${link.id}`}>URL</Label><Input disabled={disabled} id={`content-link-url-${link.id}`} value={link.url} onChange={(event) => updateLink(link.id, { url: event.target.value })} placeholder="https://example.com" /></div></div> : null;
                        })() : item.type === "gallery" ? (() => {
                          const gallery = galleries.find((entry) => entry.id === item.id);
                          return gallery ? <GalleryBlockEditor gallery={gallery} onChange={updateGallery} onDelete={() => setPendingDelete(item)} disabled={disabled} embedded /> : null;
                        })() : item.type === "divider" ? (() => {
                          const block = dividers.find((entry) => entry.id === item.id);
                          return block ? <DividerBlockEditor block={block} onChange={updateDivider} disabled={disabled} /> : null;
                        })() : item.type === "bank-details" ? (() => {
                          const block = bankDetails.find((entry) => entry.id === item.id);
                          return block ? <BankDetailsBlockEditor block={block} onChange={updateBankDetails} disabled={disabled} /> : null;
                        })() : item.type === "social" ? (
                          <div className="space-y-3">
                            {socialLinks.map((social) => <div key={social.id} className="grid gap-2 sm:grid-cols-[150px_minmax(0,1fr)_36px] sm:items-end"><div className="grid gap-2"><Label>Nền tảng</Label><Select disabled={disabled} value={social.platform} onValueChange={(platform) => onSocialLinksChange(socialLinks.map((entry) => entry.id === social.id ? { ...entry, platform } : entry))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{socialPlatforms.map((platform) => <SelectItem key={platform} value={platform}>{platform}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-2"><Label htmlFor={`content-social-url-${social.id}`}>URL hồ sơ</Label><Input disabled={disabled} id={`content-social-url-${social.id}`} value={social.url} onChange={(event) => onSocialLinksChange(socialLinks.map((entry) => entry.id === social.id ? { ...entry, url: event.target.value } : entry))} placeholder="https://..." /></div><Button disabled={disabled} type="button" variant="ghost" size="icon" aria-label={`Xóa ${social.platform}`} onClick={() => removeSocial(social.id)}><Trash2 /></Button></div>)}
                            <Button disabled={disabled} type="button" variant="outline" className="w-full border-dashed" onClick={() => { const id = `social-${generateId({ length: 10 })}`; onSocialLinksChange([...socialLinks, { id, platform: "Instagram", url: "", enabled: true }]); focusBlockField(`content-social-url-${id}`); }}><Plus />Thêm mạng xã hội</Button>
                          </div>
                        ) : (() => {
                          const widget = widgets.find((entry) => entry.id === item.id);
                          return widget ? <div className="grid gap-3 sm:grid-cols-2"><div className="grid gap-2"><Label htmlFor={`content-widget-title-${widget.id}`}>Tiêu đề</Label><Input disabled={disabled} id={`content-widget-title-${widget.id}`} value={widget.title} onChange={(event) => updateWidget(widget.id, { title: event.target.value })} placeholder="Không bắt buộc" /></div><div className="grid gap-2"><Label htmlFor={`content-widget-url-${widget.id}`}>URL</Label><Input disabled={disabled} id={`content-widget-url-${widget.id}`} value={widget.url} onChange={(event) => updateWidget(widget.id, { url: event.target.value })} placeholder="https://..." /></div></div> : null;
                        })()}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </SortableItem>
              );
            })}
          </SortableContent>
        </Sortable>
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-muted/15 px-4 py-7 text-center"><p className="text-sm font-medium text-foreground">Chưa có nội dung</p><p className="mt-1 text-xs text-muted-foreground">Thêm liên kết, bộ sưu tập hoặc nội dung media vào trang.</p></div>
      )}

      <Button type="button" variant="outline" className="h-10 w-full border-dashed shadow-none" disabled={disabled} onClick={() => setPickerOpen(true)}><Plus className="size-4" />Thêm nội dung</Button>
      <ContentBlockPickerDialog open={pickerOpen} onOpenChange={setPickerOpen} onSelect={addBlock} isTypeDisabled={(type) => type === "social" && socialLinks.length > 0} />

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Xóa khối nội dung này?</AlertDialogTitle><AlertDialogDescription>Khối sẽ được xóa khỏi trang Link Bio. File trong Media Manager vẫn được giữ lại.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => pendingDelete && deleteBlock(pendingDelete)}>Xóa khối</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
