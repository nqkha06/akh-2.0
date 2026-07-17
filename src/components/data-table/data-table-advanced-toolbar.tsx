"use client";

import type { Table } from "@tanstack/react-table";
import type * as React from "react";

import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { cn } from "@/lib/utils";

interface DataTableAdvancedToolbarProps<TData>
  extends React.ComponentProps<"div"> {
  table: Table<TData>;
}

export function DataTableAdvancedToolbar<TData>({
  table,
  children,
  className,
  ...props
}: DataTableAdvancedToolbarProps<TData>) {
  return (
    <div
      role="toolbar"
      aria-orientation="horizontal"
      className={cn(
        "flex min-w-0 w-full flex-wrap items-start justify-between gap-2 p-1",
        className,
      )}
      {...props}
    >
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">{children}</div>
      <div className="flex shrink-0 items-center gap-2">
        <DataTableViewOptions table={table} align="end" />
      </div>
    </div>
  );
}
