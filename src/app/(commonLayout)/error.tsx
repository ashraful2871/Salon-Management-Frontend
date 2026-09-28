"use client";

import { ErrorState } from "@/components/Shared/ErrorState";

export default function CommonLayoutError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container mx-auto px-4 py-16">
      <ErrorState
        title="Something went wrong"
        message="We encountered an unexpected error. Please try again."
        onRetry={reset}
        homeHref="/"
      />
    </div>
  );
}
