"use client";

import { ErrorState } from "@/components/Shared/ErrorState";

export default function BookingSummaryError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container mx-auto px-4 py-16">
      <ErrorState
        title="We could not load your summary"
        message="Nothing has been booked and no money has moved. Retry, or pick your appointment again."
        onRetry={reset}
        homeHref="/"
      />
    </div>
  );
}
