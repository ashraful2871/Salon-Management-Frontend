"use client";

import { useEffect } from "react";
import "./globals.css";
import { ErrorState } from "@/components/Shared/ErrorState";
import { SITE } from "@/lib/site";
import { BrandLogo } from "@/components/Shared/BrandLogo";

// Replaces the root layout when it fails, so it brings its own <html>, <body>
// and styles, and a full reload rather than `reset` (the layout itself broke).
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error", error.digest ?? error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-background font-sans text-foreground antialiased">
        <title>{`Something went wrong | ${SITE.name}`}</title>
        <main className="flex min-h-svh flex-col items-center justify-center gap-2 px-4 py-10">
          <BrandLogo className="text-xl" />
          <ErrorState
            className="min-h-0 w-full"
            message="The page failed to load. Reloading usually fixes it."
            onRetry={() => window.location.reload()}
            homeHref="/"
          />
        </main>
      </body>
    </html>
  );
}
