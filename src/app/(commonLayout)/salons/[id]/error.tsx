"use client";

import { ErrorState } from "@/components/Shared/ErrorState";

export default function SalonDetailError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container mx-auto px-4 py-16">
      <ErrorState
        title="Salon not found"
        message="This salon could not be loaded. It may have been removed or there was a network error."
        onRetry={reset}
        homeHref="/"
      />
    </div>
  );
}
