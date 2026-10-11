import Link from "next/link";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TONE_CLASSES } from "@/lib/status-tone";
import { cn } from "@/lib/utils";
import type { AdminInboxItem } from "@/services/admin/types";
import { inboxAge, inboxLabel } from "../inbox";

/**
 * Home's first card: the open work from `GET /admin/inbox` (the same list as
 * the top-bar bell), worst first. `nowMs` comes from the page so the ages are
 * worked out once, on the server.
 */
export function NeedsAttention({
  items,
  error,
  nowMs,
}: {
  items: AdminInboxItem[];
  error?: string | null;
  nowMs: number;
}) {
  const rank = { danger: 0, warning: 1, info: 2 } as const;
  const sorted = [...items].sort((a, b) => rank[a.tone] - rank[b.tone]);

  return (
    <Card className="gap-3">
      <CardHeader className="px-4 sm:px-6">
        <CardTitle>Needs attention</CardTitle>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        {error ? (
          <p role="alert" className="text-sm text-danger">
            Couldn&apos;t check what needs attention: {error}
          </p>
        ) : sorted.length === 0 ? (
          <p className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
            <CheckCircle2 aria-hidden="true" className={cn("size-4", TONE_CLASSES.success.text)} />
            Nothing needs you right now
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {sorted.map((item) => {
              const age = inboxAge(item, nowMs);
              return (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-3 hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span
                      aria-hidden="true"
                      className={cn("size-2.5 shrink-0 rounded-full", TONE_CLASSES[item.tone].dot)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{inboxLabel(item.key)}</span>
                      {age && (
                        <span
                          className={cn(
                            "block text-xs",
                            item.tone === "danger" ? TONE_CLASSES.danger.text : "text-muted-foreground",
                          )}
                        >
                          {age}
                        </span>
                      )}
                    </span>
                    <span className="font-display text-xl font-semibold tabular-nums">
                      {item.count.toLocaleString()}
                    </span>
                    <ArrowUpRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
