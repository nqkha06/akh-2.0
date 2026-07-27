"use client";

import { Search, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaDescription,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  contentBlockCategoryLabels,
  contentBlockRegistry,
  normalizeContentBlockSearch,
  type ContentBlockCategory,
  type ContentBlockPickerType,
} from "./content-block-registry";

type PickerCategory = "all" | "popular" | ContentBlockCategory;
const enabledContentBlocks = contentBlockRegistry.filter((definition) => definition.enabled);

export function ContentBlockPickerDialog({
  open,
  onOpenChange,
  onSelect,
  isTypeDisabled,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (type: ContentBlockPickerType) => void;
  isTypeDisabled?: (type: ContentBlockPickerType) => boolean;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<PickerCategory>("all");
  const categories = useMemo(() => {
    const available = new Set(enabledContentBlocks.map((definition) => definition.category));
    return (Object.keys(contentBlockCategoryLabels) as ContentBlockCategory[]).filter((key) => available.has(key));
  }, []);
  const normalizedQuery = normalizeContentBlockSearch(query);
  const filtered = enabledContentBlocks.filter((definition) => {
    if (category === "popular" && !definition.isPopular) return false;
    if (category !== "all" && category !== "popular" && definition.category !== category) return false;
    if (!normalizedQuery) return true;
    const searchText = normalizeContentBlockSearch([
      definition.title,
      definition.description,
      contentBlockCategoryLabels[definition.category],
      ...definition.keywords,
    ].join(" "));
    return searchText.includes(normalizedQuery);
  });

  function select(type: ContentBlockPickerType) {
    if (isTypeDisabled?.(type)) return;
    onSelect(type);
    handleOpenChange(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
    if (nextOpen) return;
    setQuery("");
    setCategory("all");
  }

  return (
    <Credenza open={open} onOpenChange={handleOpenChange}>
      <CredenzaContent className="sm:max-w-3xl">
        <CredenzaHeader className="border-b border-border bg-card">
          <CredenzaTitle>Thêm nội dung vào trang</CredenzaTitle>
          <CredenzaDescription>Chọn một loại khối để thêm vào cuối trang Link Bio.</CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody className="p-0">
          <div className="sticky top-0 z-10 space-y-3 border-b border-border bg-background/95 px-4 py-4 backdrop-blur sm:px-5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm kiếm tính năng..." aria-label="Tìm kiếm tính năng" autoFocus className="h-10 pl-9" />
            </div>
            <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Danh mục nội dung">
              {([
                { value: "all" as const, label: "Tất cả" },
                { value: "popular" as const, label: "Phổ biến" },
                ...categories.map((value) => ({ value, label: contentBlockCategoryLabels[value] })),
              ]).map((item) => (
                <button key={item.value} type="button" role="tab" aria-selected={category === item.value} onClick={() => setCategory(item.value)} className={cn("h-8 shrink-0 rounded-md px-3 text-xs font-medium outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring", category === item.value ? "bg-primary text-primary-foreground hover:bg-primary/90" : "text-muted-foreground")}>{item.label}</button>
              ))}
            </div>
          </div>
          <ScrollArea className="max-h-[58dvh]">
            <div className="p-4 sm:p-5">
              {filtered.length ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {filtered.map((definition) => {
                    const Icon = definition.icon;
                    const disabled = isTypeDisabled?.(definition.type) || false;
                    return (
                      <button key={definition.type} type="button" disabled={disabled} onClick={() => select(definition.type)} className="group flex min-h-24 w-full items-start gap-3 rounded-xl border border-border bg-card p-3.5 text-left outline-none transition-colors hover:border-primary/35 hover:bg-accent/45 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-45">
                        <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-border bg-muted/35 text-muted-foreground transition-colors group-hover:text-foreground"><Icon className="size-[18px]" /></span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-1.5"><span className="text-sm font-semibold text-foreground">{definition.title}</span>{definition.isNew ? <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">Mới</Badge> : definition.isPopular ? <Badge variant="outline" className="h-5 px-1.5 text-[10px]"><Sparkles className="size-3" />Phổ biến</Badge> : null}</span>
                          <span className="mt-1.5 line-clamp-2 text-xs leading-5 text-muted-foreground">{disabled && definition.type === "social" ? "Khối mạng xã hội đã có trên trang." : definition.description}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="grid min-h-52 place-items-center px-6 text-center"><div><Search className="mx-auto size-6 text-muted-foreground" /><p className="mt-3 text-sm font-medium text-foreground">Không tìm thấy tính năng phù hợp</p><p className="mt-1 text-xs text-muted-foreground">Hãy thử từ khóa hoặc danh mục khác.</p></div></div>
              )}
            </div>
          </ScrollArea>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  );
}
