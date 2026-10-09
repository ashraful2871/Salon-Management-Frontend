"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight, Info, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Announcement } from "@/services/settings/getPublicSettings";

const COOKIE = "sm_ann";

const subscribe = () => () => {};

const dismissedCookie = (hash: string) =>
  document.cookie.split("; ").some((c) => c === `${COOKIE}=${hash}`);

/**
 * The bar itself. Also used as the live preview in the settings editor, where
 * `preview` turns the dismissal into a no-op.
 */
export function AnnouncementBarClient({
  announcement,
  hash,
  preview = false,
}: {
  announcement: Announcement;
  hash: string;
  preview?: boolean;
}) {
  // The server (and the first client render) never sees the cookie, so the
  // page stays static; a dismissed bar goes away right after hydration.
  const dismissedBefore = useSyncExternalStore(
    subscribe,
    () => !preview && dismissedCookie(hash),
    () => false,
  );
  const [dismissed, setDismissed] = useState(false);
  if (dismissedBefore || dismissed) return null;

  const warning = announcement.tone === "warning";
  const Icon = warning ? TriangleAlert : Info;
  const external = announcement.href?.startsWith("http");

  const dismiss = () => {
    if (!preview) {
      document.cookie = `${COOKIE}=${hash}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
    }
    setDismissed(true);
  };

  return (
    <div
      role="region"
      aria-label="Announcement"
      className={cn(
        "border-b text-sm",
        warning
          ? "border-warning/30 bg-warning-soft text-foreground"
          : "border-info/30 bg-info-soft text-foreground",
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 sm:px-6">
        <Icon
          className={cn("h-4 w-4 shrink-0", warning ? "text-warning" : "text-info")}
          aria-hidden
        />
        <p className="min-w-0 flex-1">
          {announcement.message}
          {announcement.href && (
            <>
              {" "}
              <Link
                href={announcement.href}
                className="inline-flex items-center gap-1 font-semibold underline underline-offset-2"
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                Learn more
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </>
          )}
        </p>
        {announcement.dismissible && (
          <button
            type="button"
            onClick={dismiss}
            className="-mr-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Dismiss announcement"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}
