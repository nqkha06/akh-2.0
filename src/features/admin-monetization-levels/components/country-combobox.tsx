"use client";

import { Check, ChevronsUpDown, Globe2 } from "lucide-react";
import { useLocale } from "next-intl";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ISO_COUNTRY_CODES } from "@/features/admin-monetization-levels/country-codes";
import { cn } from "@/lib/utils";

type CountryOption = {
  code: string;
  name: string;
  special?: boolean;
};

export function CountryCombobox({
  id,
  value,
  onChange,
  allowAll = true,
}: {
  id: string;
  value: string;
  onChange: (countryCode: string) => void;
  allowAll?: boolean;
}) {
  const locale = useLocale();
  const isVietnamese = locale.toLowerCase().startsWith("vi");
  const [open, setOpen] = React.useState(false);
  const options = React.useMemo(() => {
    const countryOptions = buildCountryOptions(locale, isVietnamese);
    return allowAll
      ? countryOptions
      : countryOptions.filter((option) => option.code !== "ALL");
  }, [allowAll, isVietnamese, locale]);
  const selected = options.find((option) => option.code === value) ?? {
    code: value,
    name: value,
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={isVietnamese ? "Chọn quốc gia" : "Select a country"}
          className="h-9 w-full min-w-0 justify-between bg-background px-3 font-normal shadow-xs"
        >
          <span className="flex min-w-0 items-center gap-2">
            <CountryFlag code={selected.code} />
            <span className="truncate">{selected.name}</span>
            <span className="shrink-0 font-mono text-xs text-muted-foreground">
              {selected.code}
            </span>
          </span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) min-w-72 p-0"
      >
        <Command>
          <CommandInput
            placeholder={
              isVietnamese
                ? "Tìm theo tên hoặc mã quốc gia..."
                : "Search by country name or code..."
            }
          />
          <CommandList>
            <CommandEmpty>
              {isVietnamese ? "Không tìm thấy quốc gia." : "No country found."}
            </CommandEmpty>
            <CommandGroup
              heading={isVietnamese ? "Giá trị hệ thống" : "System values"}
            >
              {options
                .filter((option) => option.special)
                .map((option) => (
                  <CountryItem
                    key={option.code}
                    option={option}
                    selectedCode={value}
                    onSelect={(code) => {
                      onChange(code);
                      setOpen(false);
                    }}
                  />
                ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading={isVietnamese ? "Quốc gia" : "Countries"}>
              {options
                .filter((option) => !option.special)
                .map((option) => (
                  <CountryItem
                    key={option.code}
                    option={option}
                    selectedCode={value}
                    onSelect={(code) => {
                      onChange(code);
                      setOpen(false);
                    }}
                  />
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function CountryItem({
  option,
  selectedCode,
  onSelect,
}: {
  option: CountryOption;
  selectedCode: string;
  onSelect: (code: string) => void;
}) {
  return (
    <CommandItem
      value={`${option.code} ${option.name}`}
      onSelect={() => onSelect(option.code)}
    >
      <CountryFlag code={option.code} />
      <span className="min-w-0 flex-1 truncate">{option.name}</span>
      <span className="font-mono text-xs text-muted-foreground">
        {option.code}
      </span>
      <Check
        className={cn(
          "size-4",
          selectedCode === option.code ? "opacity-100" : "opacity-0",
        )}
      />
    </CommandItem>
  );
}

function CountryFlag({ code }: { code: string }) {
  if (code === "ALL") {
    return (
      <span className="grid size-5 shrink-0 place-items-center rounded-sm bg-primary/10 text-primary">
        <Globe2 className="size-3.5" />
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        "fi shrink-0 rounded-[2px] shadow-sm ring-1 ring-black/5",
        `fi-${code === "ZZ" ? "xx" : code.toLowerCase()}`,
      )}
    />
  );
}

function buildCountryOptions(
  locale: string,
  isVietnamese: boolean,
): CountryOption[] {
  const displayNames = new Intl.DisplayNames([locale], {
    type: "region",
  });
  const collator = new Intl.Collator(locale, { sensitivity: "base" });
  const countries = ISO_COUNTRY_CODES.map((code) => ({
    code,
    name: displayNames.of(code) ?? code,
  })).sort((left, right) => collator.compare(left.name, right.name));

  return [
    {
      code: "ALL",
      name: isVietnamese ? "Tất cả quốc gia" : "All countries",
      special: true,
    },
    {
      code: "ZZ",
      name: isVietnamese ? "Không xác định" : "Unknown region",
      special: true,
    },
    ...countries,
  ];
}
