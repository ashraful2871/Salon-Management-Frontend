"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/Shared/ErrorState";

// Sits inside the dashboard layout, so a failing page keeps the sidebar and
// top bar and the user can move on without a reload.
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // The digest matches the server log entry; the message is hidden in production.
    console.error("Dashboard error", error.digest ?? error);
  }, [error]);

  return <ErrorState onRetry={reset} homeHref="/dashboard" />;
}
