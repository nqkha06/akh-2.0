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
        <span className="text-sm font-medium text-foreground">{field.label}</span>

        <select
          name={field.id}
          defaultValue=""
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
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
      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-background p-3 transition-colors hover:bg-muted/30">
        <input
          name={field.id}
          type="checkbox"
          className="mt-1 size-4 rounded border-input accent-primary focus:ring-ring"
        />

        <span>
          <span className="block text-sm font-medium text-foreground">
            {field.label}
          </span>

          {field.description ? (
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {field.description}
            </span>
          ) : null}
        </span>
      </label>
    );
  }

  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-foreground">{field.label}</span>

      <input
        name={field.id}
        type={field.type}
        placeholder={field.placeholder}
        className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"
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
          className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <Filter size={16} />
          {buttonLabel}
        </button>
      </DrawerTrigger>

      <DrawerContent>
        <DrawerHeader className="border-b border-border px-5 py-4 text-left">
          <DrawerTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Filter size={17} className="text-primary" />
            {title}
          </DrawerTitle>

          <p className="text-sm leading-6 text-muted-foreground">
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
              <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                Chưa cấu hình trường lọc.
              </div>
            )}
          </div>

          <div className="flex gap-2 border-t border-border bg-background px-5 py-4">
            <button
              type="reset"
              className="inline-flex h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <RotateCcw size={15} />
              Đặt lại
            </button>

            <button
              type="submit"
              className="inline-flex h-10 flex-1 cursor-pointer items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Áp dụng
            </button>
          </div>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
