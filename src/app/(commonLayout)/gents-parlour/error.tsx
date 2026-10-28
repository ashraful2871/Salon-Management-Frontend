"use client";

import { ErrorState } from "@/components/Shared/ErrorState";

export default function GentsParlourError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container mx-auto px-4 py-16">
      <ErrorState
        title="Failed to load gents parlours"
        message="We could not fetch the parlour listings. Please check your connection and try again."
        onRetry={reset}
        homeHref="/"
      />
    </div>
  );
}
