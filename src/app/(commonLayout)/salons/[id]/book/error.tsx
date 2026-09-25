"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function BookingSummaryError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams<{ id: string }>();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="mb-2 text-2xl font-bold">We could not load your summary</h1>
        <p className="mb-8 text-muted-foreground">
          Nothing has been booked and no money has moved. Retry, or pick your
          appointment again.
        </p>
        <div className="flex justify-center gap-3">
          <Button onClick={reset} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
          <Button variant="outline" asChild>
            <Link href={params?.id ? `/salons/${params.id}` : "/salons"}>
              Back to the salon
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
