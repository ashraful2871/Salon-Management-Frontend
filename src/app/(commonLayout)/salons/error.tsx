"use client";

import { ErrorState } from "@/components/Shared/ErrorState";

export default function SalonsError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container mx-auto px-4 py-16">
      <ErrorState
        title="Failed to load salons"
        message="We could not fetch the salon listings. Please check your connection and try again."
        onRetry={reset}
        homeHref="/"
      />
    </div>
  );
}
