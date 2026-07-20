"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  publicationStatusOptions,
  type PublicationStatus,
} from "@/types/publication-status";

export function PublicationStatusCard({
  status,
  onStatusChange,
  id = "publication-status",
  disabled = false,
  disabledReason,
}: {
  status: PublicationStatus;
  onStatusChange: (status: PublicationStatus) => void;
  id?: string;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const selected = publicationStatusOptions.find(
    (option) => option.value === status,
  );

  return (
    <Card className="gap-0 rounded-2xl border-border/80 bg-background/95 py-0 shadow-sm">
      <CardHeader className="px-6 py-5">
        <h2 className="font-semibold leading-none tracking-tight">
          Trạng thái
        </h2>
        <p className="text-sm leading-5 text-muted-foreground">
          Chọn thời điểm nội dung được phép xuất hiện trong hệ thống.
        </p>
      </CardHeader>
      <CardContent className="space-y-2 px-6 pb-6">
        <Label htmlFor={id}>Trạng thái</Label>
        <Select
          value={status}
          disabled={disabled}
          onValueChange={onStatusChange}
        >
          <SelectTrigger id={id} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {publicationStatusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm leading-5 text-muted-foreground">
          {disabled && disabledReason
            ? disabledReason
            : selected?.description}
        </p>
      </CardContent>
    </Card>
  );
}
