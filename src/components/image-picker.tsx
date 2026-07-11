"use client";
/* eslint-disable @next/next/no-img-element */

import { ImagePlus, Link2, X } from "lucide-react";

import { Input } from "@/components/ui/input";

const presetImages = [
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1526318472351-c75fcf070305?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
];

type ImagePickerProps = {
  selectedImage?: string;
  onImageSelect: (imageUrl: string | undefined) => void;
};

export default function ImagePicker({
  selectedImage,
  onImageSelect,
}: ImagePickerProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {presetImages.map((imageUrl) => {
          const selected = selectedImage === imageUrl;

          return (
            <button
              key={imageUrl}
              type="button"
              onClick={() => onImageSelect(imageUrl)}
              className={`relative aspect-[4/3] cursor-pointer overflow-hidden rounded-lg border transition ${
                selected
                  ? "border-blue-500 ring-2 ring-blue-100"
                  : "border-slate-200 hover:border-slate-300"
              }`}
              aria-label="Select background image"
            >
              <img
                src={imageUrl}
                alt=""
                className="h-full w-full object-cover"
              />
              {selected ? (
                <span className="absolute right-2 top-2 rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-bold text-white">
                  Selected
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-blue-300 focus-within:bg-white">
        <Link2 className="size-4 shrink-0 text-slate-400" />
        <Input
          value={selectedImage || ""}
          onChange={(event) => onImageSelect(event.target.value || undefined)}
          placeholder="Paste image URL"
          className="h-8 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
        />
      </label>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onImageSelect(presetImages[0])}
          className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-slate-900 px-3 text-xs font-bold text-white transition hover:bg-slate-800"
        >
          <ImagePlus className="size-4" />
          Use preset
        </button>
        {selectedImage ? (
          <button
            type="button"
            onClick={() => onImageSelect(undefined)}
            className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 transition hover:text-slate-950"
          >
            <X className="size-4" />
            Clear
          </button>
        ) : null}
      </div>
    </div>
  );
}
