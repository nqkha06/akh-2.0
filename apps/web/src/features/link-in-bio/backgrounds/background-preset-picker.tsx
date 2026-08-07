"use client";
/* eslint-disable @next/next/no-img-element */

import { Check, ImageIcon } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import {
  bioBackgroundPresetCategoryLabels,
  bioBackgroundPresets,
  type BioBackgroundPreset,
  type BioBackgroundPresetCategory,
} from "./background-presets";

type PresetCategory = "all" | BioBackgroundPresetCategory;

const presetCategories: PresetCategory[] = [
  "all",
  ...Array.from(new Set(bioBackgroundPresets.map((preset) => preset.category))),
];

export function BackgroundPresetPicker({
  selectedPresetId,
  onSelect,
}: {
  selectedPresetId?: string;
  onSelect: (preset: BioBackgroundPreset) => void;
}) {
  const [category, setCategory] = useState<PresetCategory>("all");
  const filteredPresets = category === "all"
    ? bioBackgroundPresets
    : bioBackgroundPresets.filter((preset) => preset.category === category);

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">Chọn một phong cách có sẵn</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Mỗi mẫu đã phối sẵn background, màu nút, chữ và các khối nội dung.
          </p>
        </div>
        <Badge variant="secondary" className="shrink-0 tabular-nums">
          {filteredPresets.length} mẫu
        </Badge>
      </div>

      <ScrollArea className="w-full whitespace-nowrap">
        <ToggleGroup
          type="single"
          value={category}
          onValueChange={(value) => value && setCategory(value as PresetCategory)}
          variant="outline"
          spacing={1}
          className="w-max"
          aria-label="Lọc background theo chủ đề"
        >
          {presetCategories.map((value) => (
            <ToggleGroupItem key={value} value={value} size="sm">
              {value === "all" ? "Tất cả" : bioBackgroundPresetCategoryLabels[value]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </ScrollArea>

      <div className="grid max-h-[28rem] grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4">
        {filteredPresets.map((preset) => {
          const selected = selectedPresetId === preset.id;

          return (
            <button
              key={preset.id}
              type="button"
              aria-label={`Chọn background ${preset.name}`}
              aria-pressed={selected}
              onClick={() => onSelect(preset)}
              className={`group relative aspect-[9/16] min-w-0 overflow-hidden rounded-lg border bg-muted text-left shadow-sm transition-[border-color,box-shadow,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none ${
                selected
                  ? "border-primary ring-2 ring-primary/25"
                  : "border-border hover:-translate-y-0.5 hover:border-foreground/30 hover:shadow-md motion-reduce:hover:translate-y-0"
              }`}
            >
              <img
                src={preset.imageUrl}
                alt=""
                loading="lazy"
                decoding="async"
                className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-[1.025] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-transparent" />
              <span
                className="absolute inset-x-2 top-[22%] rounded-md border px-1.5 py-2 shadow-sm backdrop-blur-sm"
                style={{
                  backgroundColor: preset.theme.surfaceColor,
                  borderColor: preset.theme.surfaceBorderColor,
                }}
                aria-hidden
              >
                <span
                  className="mx-auto mb-1.5 block size-3 rounded-full"
                  style={{ backgroundColor: preset.theme.accentColor }}
                />
                <span
                  className="block h-2.5 rounded-full border"
                  style={{
                    backgroundColor: preset.theme.buttonColor,
                    borderColor: preset.theme.buttonBorderColor,
                  }}
                />
                <span
                  className="mt-1 block h-2.5 rounded-full border"
                  style={{
                    backgroundColor: preset.theme.sectionColor,
                    borderColor: preset.theme.sectionBorderColor,
                  }}
                />
              </span>
              <span className="absolute inset-x-0 bottom-0 p-2">
                <span className="block line-clamp-2 text-[11px] font-semibold leading-4 text-white">
                  {preset.name}
                </span>
              </span>
              {selected ? (
                <span className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground shadow-md">
                  <Check className="size-3.5" aria-hidden />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {filteredPresets.length === 0 ? (
        <div className="grid min-h-32 place-items-center rounded-lg border border-dashed border-border bg-muted/20 px-4 text-center">
          <div>
            <ImageIcon className="mx-auto size-5 text-muted-foreground" aria-hidden />
            <p className="mt-2 text-sm font-medium text-foreground">Chưa có background trong chủ đề này</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
