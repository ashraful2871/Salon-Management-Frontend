"use client";

import { Fragment, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AlertTriangle, ChevronDown, ChevronRight, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import CopyButton from "@/components/Wallet/CopyButton";
import type { ApiResponse } from "@/lib/api-types";
import { formatBDT } from "@/lib/money";
import { gatewayRefLabel, providerLabel } from "@/lib/payment-providers";
import { cn } from "@/lib/utils";
import type {
  AdminTopup,
  AdminTopupRefund,
} from "@/services/payments/getAdminTopups";
import { RefundDialog } from "./RefundDialog";

export type TopupFilters = {
  page: number;
  status: string;
  provider: string;
  q: string;
};

const STATUS_OPTIONS = [
  { value: "SUCCESS", label: "Successful" },
  { value: "PENDING", label: "Pending" },
  { value: "INITIATED", label: "Initiated" },
  { value: "FAILED", label: "Failed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "EXPIRED", label: "Expired" },
  { value: "ALL", label: "All statuses" },
];

const METHOD_OPTIONS = [
  { value: "ALL", label: "All methods" },
  { value: "BKASH", label: "bKash" },
  { value: "SSLCOMMERZ", label: "SSLCommerz" },
];

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Dhaka",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const formatDate = (iso?: string | null) =>
  iso ? dateFormat.format(new Date(iso)) : "—";

const AMBER = "border-amber-300 bg-amber-100 text-amber-800";

const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case "SUCCESS":
      return <Badge className="bg-sage text-white">Successful</Badge>;
    case "PENDING":
    case "INITIATED":
      return (
        <Badge variant="outline" className={AMBER}>
          {status === "PENDING" ? "Pending" : "Initiated"}
        </Badge>
      );
    case "FAILED":
      return <Badge variant="destructive">Failed</Badge>;
    default:
      return (
        <Badge variant="secondary">
          {status.charAt(0) + status.slice(1).toLowerCase()}
        </Badge>
      );
  }
};

const RefundStatusBadge = ({
  status,
}: {
  status: AdminTopupRefund["status"];
}) =>
  status === "COMPLETED" ? (
    <Badge className="bg-green-600 text-white">Completed</Badge>
  ) : status === "UNKNOWN" ? (
    <Badge variant="outline" className={AMBER}>
      Unknown
    </Badge>
  ) : (
    <Badge variant="destructive">Failed</Badge>
  );

/** Why the Refund button is off, or null when it is on. */
const refundBlockedReason = (topup: AdminTopup) => {
  if (topup.status !== "SUCCESS") return "Only a successful top-up can be refunded";
  if (topup.remainingMinor <= 0) return "This top-up has already been refunded in full";
  return null;
};

const RefundHistory = ({ topup }: { topup: AdminTopup }) => (
  <div className="space-y-2 py-1">
    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
      Refund history
    </p>
    <ul className="space-y-2">
      {topup.refunds.map((refund) => (
        <li
          key={refund.n}
          className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md border bg-background px-3 py-2 text-sm"
        >
          <span className="font-medium">#{refund.n}</span>
          <span>{formatBDT(refund.amountMinor)}</span>
          <RefundStatusBadge status={refund.status} />
          {refund.refundRef ? (
            <span className="flex items-center gap-1">
              <span className="font-mono text-xs">{refund.refundRef}</span>
              <CopyButton
                value={refund.refundRef}
                label={topup.provider === "BKASH" ? "Refund TrxID" : "Refund reference"}
              />
            </span>
          ) : null}
          <span className="text-muted-foreground">{formatDate(refund.at)}</span>
          {refund.status !== "COMPLETED" && refund.message ? (
            <span
              className={cn(
                "basis-full text-xs",
                refund.status === "FAILED" ? "text-destructive" : "text-amber-700",
              )}
            >
              {refund.message}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  </div>
);

export function TopupsClient({
  response,
  filters,
}: {
  response: ApiResponse<AdminTopup[]>;
  filters: TopupFilters;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [refunding, setRefunding] = useState<AdminTopup | null>(null);

  const topups = response.success && Array.isArray(response.data) ? response.data : [];
  const total = response.meta?.total ?? 0;
  const limit = response.meta?.limit || 20;
  const page = response.meta?.page ?? filters.page;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  // Every filter lives in the URL; any change but paging starts from page 1.
  const navigate = (next: Partial<TopupFilters>) => {
    const merged = { ...filters, page: 1, ...next };
    const params = new URLSearchParams();
    if (merged.page > 1) params.set("page", String(merged.page));
    if (merged.status && merged.status !== "SUCCESS") params.set("status", merged.status);
    if (merged.provider) params.set("provider", merged.provider);
    if (merged.q) params.set("q", merged.q);
    const query = params.toString();
    startTransition(() => router.push(query ? `${pathname}?${query}` : pathname));
  };

  const toggle = (id: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="min-w-0 space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold">Top-ups &amp; Refunds</h1>
        <p className="mt-1 text-muted-foreground">
          Refunds send money back to the customer&apos;s bKash or card and take it
          out of their wallet.
        </p>
      </div>

      <Card className="min-w-0">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center">
          <form
            className="relative w-full md:max-w-xs"
            onSubmit={(e) => {
              e.preventDefault();
              const q = String(new FormData(e.currentTarget).get("q") ?? "").trim();
              navigate({ q });
            }}
          >
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              key={filters.q}
              name="q"
              type="search"
              defaultValue={filters.q}
              placeholder="Txn ID, bKash TrxID, email or name"
              aria-label="Search top-ups"
              className="pl-9"
            />
          </form>
          <Select
            value={filters.status}
            onValueChange={(status) => navigate({ status })}
          >
            <SelectTrigger className="w-full md:w-40" aria-label="Status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.provider || "ALL"}
            onValueChange={(value) =>
              navigate({ provider: value === "ALL" ? "" : value })
            }
          >
            <SelectTrigger className="w-full md:w-40" aria-label="Method">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {METHOD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>

        <CardContent
          className={cn("min-w-0 transition-opacity", isPending && "opacity-60")}
        >
          {!response.success ? (
            <p className="py-10 text-center text-destructive">{response.message}</p>
          ) : topups.length === 0 ? (
            <p className="py-10 text-center text-muted-foreground">
              No top-ups match these filters.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">
                    <span className="sr-only">Refund history</span>
                  </TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Txn ID</TableHead>
                  <TableHead>Refunded</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topups.map((topup) => {
                  const isOpen = expanded.has(topup.id);
                  const blocked = refundBlockedReason(topup);

                  return (
                    <Fragment key={topup.id}>
                      <TableRow className={cn(isOpen && "border-b-0 bg-muted/30")}>
                        <TableCell className="align-top">
                          {topup.refunds.length > 0 ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              aria-expanded={isOpen}
                              aria-label={isOpen ? "Hide refund history" : "Show refund history"}
                              onClick={() => toggle(topup.id)}
                            >
                              {isOpen ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          ) : null}
                        </TableCell>
                        <TableCell className="align-top text-muted-foreground">
                          {formatDate(topup.createdAt)}
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="font-medium">{topup.customer.name || "—"}</div>
                          <div className="text-xs text-muted-foreground">
                            {topup.customer.email}
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          {providerLabel(topup.provider)}
                        </TableCell>
                        <TableCell className="align-top text-right font-medium">
                          {formatBDT(topup.amountMinor)}
                        </TableCell>
                        <TableCell className="align-top">
                          <StatusBadge status={topup.status} />
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="flex items-center gap-1">
                            <span
                              className="max-w-[9rem] truncate font-mono text-xs"
                              title={topup.transactionId}
                            >
                              {topup.transactionId}
                            </span>
                            <CopyButton value={topup.transactionId} />
                          </div>
                          {topup.gatewayRef ? (
                            <div className="text-xs text-muted-foreground">
                              {gatewayRefLabel(topup.provider)}:{" "}
                              <span className="font-mono">{topup.gatewayRef}</span>
                            </div>
                          ) : null}
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="flex flex-col items-start gap-1">
                            <span>
                              {topup.refundedMinor > 0 ? formatBDT(topup.refundedMinor) : "—"}
                            </span>
                            {topup.refundedMinor > 0 && topup.remainingMinor <= 0 ? (
                              <Badge variant="secondary">Fully refunded</Badge>
                            ) : null}
                            {topup.hasUnknownRefund ? (
                              <Badge variant="outline" className={AMBER}>
                                <AlertTriangle className="h-3 w-3" />
                                Check in merchant portal
                              </Badge>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="align-top text-right">
                          {/* A disabled button gets no pointer events, so the reason sits on a wrapper. */}
                          <span className="inline-block" title={blocked ?? undefined}>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={blocked !== null}
                              onClick={() => setRefunding(topup)}
                            >
                              Refund
                            </Button>
                          </span>
                        </TableCell>
                      </TableRow>
                      {isOpen ? (
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                          <TableCell />
                          <TableCell colSpan={8} className="whitespace-normal pt-0">
                            <RefundHistory topup={topup} />
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {response.success && total > 0 ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">
                {total} top-up{total === 1 ? "" : "s"}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || isPending}
                  onClick={() => navigate({ page: page - 1 })}
                >
                  Prev
                </Button>
                <span>
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || isPending}
                  onClick={() => navigate({ page: page + 1 })}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {refunding ? (
        <RefundDialog
          key={refunding.id}
          topup={refunding}
          onClose={() => setRefunding(null)}
        />
      ) : null}
    </div>
  );
}
