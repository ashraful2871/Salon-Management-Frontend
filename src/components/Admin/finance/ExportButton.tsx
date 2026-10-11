"use client";

import { Download } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ExportKind = "bookings" | "ledger" | "payouts" | "topups" | "users";

/**
 * A plain download link to `/api/admin/export/<kind>.csv`, which streams the
 * API's CSV with the admin's access token. No client JS: the browser saves it.
 * Needs finance.export (and users.view for users); the API answers 403 without.
 */
export function ExportButton({
  kind,
  from,
  to,
  includeTest,
  label = "Export CSV",
  className,
}: {
  kind: ExportKind;
  from?: string;
  to?: string;
  includeTest?: boolean;
  label?: string;
  className?: string;
}) {
  const query = new URLSearchParams();
  if (from) query.set("from", from);
  if (to) query.set("to", to);
  if (includeTest) query.set("includeTest", "1");
  const qs = query.toString();

  return (
    <a
      href={`/api/admin/export/${kind}.csv${qs ? `?${qs}` : ""}`}
      download
      className={cn(buttonVariants({ variant: "secondary", size: "sm" }), className)}
    >
      <Download className="size-4" aria-hidden />
      {label}
    </a>
  );
}
