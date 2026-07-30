"use client";

import { Check, Sparkles } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import type { LinkAnimationEffect } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import {
  getLinkAnimationClassName,
  linkAnimationPresets,
  normalizeLinkAnimationEffect,
} from "./link-animation";

function AnimationOptions({
  selectedEffect,
  onSelect,
}: {
  selectedEffect: LinkAnimationEffect;
  onSelect: (effect: LinkAnimationEffect) => void;
}) {
  const [preview, setPreview] = useState<{ effect: LinkAnimationEffect; revision: number }>({
    effect: selectedEffect,
    revision: 0,
  });

  function replay(effect: LinkAnimationEffect) {
    setPreview((current) => ({
      effect,
      revision: current.revision + 1,
    }));
  }

  return (
    <div className="grid grid-cols-2 gap-2 p-3 sm:p-4">
      {linkAnimationPresets.map(({ effect, label }) => {
        const selected = effect === selectedEffect;
        return (
          <button
            key={effect}
            type="button"
            aria-pressed={selected}
            aria-label={`Dùng hiệu ứng ${label}`}
            onClick={() => {
              replay(effect);
              onSelect(effect);
            }}
            onPointerEnter={() => replay(effect)}
            onFocus={() => replay(effect)}
            className={cn(
              "link-animation-option relative min-h-20 rounded-lg border bg-background p-2.5 text-left outline-none transition-colors hover:bg-accent/45 focus-visible:ring-2 focus-visible:ring-ring",
              selected ? "border-primary bg-primary/5" : "border-border",
            )}
          >
            <span className="mb-2 flex h-7 items-center justify-center overflow-visible px-1">
              <span
                key={`${effect}:${preview.effect === effect ? preview.revision : 0}`}
                aria-hidden
                className={cn(
                  "link-animation-option-preview block h-4 w-full max-w-20 rounded-full border border-primary/25 bg-primary/15",
                  getLinkAnimationClassName(effect),
                  preview.effect === effect && effect !== "none" && "link-animation-option-preview--playing",
                )}
              />
            </span>
            <span className="flex items-center justify-between gap-2">
              <span className="truncate text-xs font-medium text-foreground">{label}</span>
              {selected ? <Check className="size-3.5 shrink-0 text-primary" aria-hidden /> : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function LinkAnimationPicker({
  effect,
  disabled,
  onChange,
}: {
  effect?: LinkAnimationEffect;
  disabled?: boolean;
  onChange: (effect: LinkAnimationEffect) => void;
}) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const selectedEffect = normalizeLinkAnimationEffect(effect);
  const active = selectedEffect !== "none";

  function select(nextEffect: LinkAnimationEffect) {
    onChange(nextEffect);
  }

  const triggerButton = (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="icon-sm"
      disabled={disabled}
      aria-label="Hiệu ứng"
      aria-pressed={active}
      onClick={() => isMobile && setOpen(true)}
      className={cn("text-muted-foreground", active && "text-primary")}
    >
      <Sparkles className="size-4" />
    </Button>
  );

  if (isMobile) {
    return (
      <>
        <Tooltip>
          <TooltipTrigger asChild>{triggerButton}</TooltipTrigger>
          <TooltipContent>Hiệu ứng</TooltipContent>
        </Tooltip>
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent>
            <DrawerHeader className="border-b border-border text-left">
              <DrawerTitle>Hiệu ứng liên kết</DrawerTitle>
              <DrawerDescription>Chọn chuyển động nhẹ để làm nổi bật liên kết.</DrawerDescription>
            </DrawerHeader>
            <div className="max-h-[60dvh] overflow-y-auto pb-4">
              <AnimationOptions selectedEffect={selectedEffect} onSelect={select} />
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Hiệu ứng</TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className="w-80 p-0">
        <PopoverHeader className="border-b border-border px-4 py-3">
          <PopoverTitle>Hiệu ứng liên kết</PopoverTitle>
          <PopoverDescription>Chạy một nhịp ngắn rồi tự nghỉ.</PopoverDescription>
        </PopoverHeader>
        <AnimationOptions selectedEffect={selectedEffect} onSelect={select} />
      </PopoverContent>
    </Popover>
  );
}
