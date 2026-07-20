"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function MemberLevelsError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <Card className="mx-auto max-w-lg border-destructive/20 shadow-none">
      <CardContent className="p-6 text-center">
        <div className="mx-auto grid size-11 place-items-center rounded-lg bg-destructive/10 text-destructive">
          <AlertTriangle className="size-5" />
        </div>
        <h1 className="mt-4 text-lg font-semibold">
          Không tải được cấp độ kiếm tiền
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {error.message}
        </p>
        <Button className="mt-5" variant="outline" onClick={reset}>
          Thử lại
        </Button>
      </CardContent>
    </Card>
  );
}
