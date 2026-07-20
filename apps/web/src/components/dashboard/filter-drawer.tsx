"use client";

import { useEffect, useMemo, useState } from "react";
import { Filter, RotateCcw } from "lucide-react";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

type FilterOption = {
  label: string;
  value: string;
};

export type ToolbarFilterField =
  | {
      id: string;
      label: string;
      type: "select";
      placeholder?: string;
      options: FilterOption[];
    }
  | {
      id: string;
      label: string;
      type: "text" | "number" | "date";
      placeholder?: string;
    }
  | {
      id: string;
      label: string;
      type: "checkbox";
      description?: string;
    };

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);

    const updateMatches = () => setMatches(media.matches);

    updateMatches();
    media.addEventListener("change", updateMatches);

    return () => media.removeEventListener("change", updateMatches);
  }, [query]);

  return matches;
}

function FilterField({ field }: { field: ToolbarFilterField }) {
  if (field.type === "select") {
    return (
      <label className="grid gap-2">
        <span className="text-sm font-bold text-slate-700">{field.label}</span>

        <select
          name={field.id}
          defaultValue=""
          className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
        >
          <option value="">{field.placeholder ?? "Tất cả"}</option>

          {field.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (field.type === "checkbox") {
    return (
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-blue-200 hover:bg-blue-50">
        <input
          name={field.id}
          type="checkbox"
          className="mt-1 size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />

        <span>
          <span className="block text-sm font-bold text-slate-800">
            {field.label}
          </span>

          {field.description ? (
            <span className="mt-0.5 block text-xs font-semibold text-slate-500">
              {field.description}
            </span>
          ) : null}
        </span>
      </label>
    );
  }

  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold text-slate-700">{field.label}</span>

      <input
        name={field.id}
        type={field.type}
        placeholder={field.placeholder}
        className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
      />
    </label>
  );
}

export function ToolbarFilterDrawer({
  fields = [],
  title = "Bộ lọc",
  description = "Tinh chỉnh kết quả hiển thị theo các điều kiện bên dưới.",
  buttonLabel = "Bộ lọc",
}: {
  fields?: ToolbarFilterField[];
  title?: string;
  description?: string;
  buttonLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const direction = useMemo(
    () => (isDesktop ? "right" : "bottom"),
    [isDesktop],
  );

  return (
    <Drawer
      key={direction}
      open={open}
      onOpenChange={setOpen}
      direction={direction}
    >
      <DrawerTrigger asChild>
        <button
          type="button"
          className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/70"
        >
          <Filter size={16} />
          {buttonLabel}
        </button>
      </DrawerTrigger>

      <DrawerContent
        // className="
        //   z-[210] overflow-hidden border-slate-200 bg-white p-0 text-slate-900

        //   max-h-[86dvh] rounded-b-none rounded-t-2xl
        //   shadow-[0_-18px_48px_rgba(15,23,42,0.18)]

        //   md:fixed md:inset-y-0 md:left-auto md:right-0
        //   md:h-dvh md:max-h-dvh md:w-[420px]
        //   md:rounded-none md:rounded-l-2xl
        //   md:border-l
        //   md:shadow-[-18px_0_48px_rgba(15,23,42,0.16)]

        //   [&>div:first-child]:mx-auto
        //   [&>div:first-child]:mt-3
        //   md:[&>div:first-child]:hidden
        // "
      >
        <DrawerHeader className="border-b border-slate-200 px-5 py-4 text-left">
          <DrawerTitle className="flex items-center gap-2 text-base font-bold text-slate-950">
            <Filter size={17} className="text-blue-600" />
            {title}
          </DrawerTitle>

          <p className="text-sm font-medium leading-6 text-slate-500">
            {description}
          </p>
        </DrawerHeader>

        <form
          className="flex max-h-[calc(86dvh-88px)] flex-col md:h-[calc(100dvh-89px)] md:max-h-none"
          onSubmit={(event) => {
            event.preventDefault();
            setOpen(false);
          }}
        >
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
            {fields.length > 0 ? (
              fields.map((field) => (
                <FilterField key={field.id} field={field} />
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                Chưa cấu hình trường lọc.
              </div>
            )}
          </div>

          <div className="flex gap-2 border-t border-slate-200 bg-white px-5 py-4">
            <button
              type="reset"
              className="inline-flex h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
            >
              <RotateCcw size={15} />
              Đặt lại
            </button>

            <button
              type="submit"
              className="inline-flex h-10 flex-1 cursor-pointer items-center justify-center rounded-xl bg-blue-600 px-3 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              Áp dụng
            </button>
          </div>
        </form>
      </DrawerContent>
    </Drawer>
  );
}