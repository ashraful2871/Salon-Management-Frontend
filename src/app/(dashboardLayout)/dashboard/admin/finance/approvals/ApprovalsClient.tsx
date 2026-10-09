"use client";

import Link from "next/link";
import { UserCheck } from "lucide-react";
import { PageHeader } from "@/components/Shared/PageHeader";
import { EmptyState } from "@/components/Shared/EmptyState";
import { ErrorState } from "@/components/Shared/ErrorState";
import { ApprovalCard } from "@/components/Admin/finance/ApprovalCard";
import { useFilterNavigation } from "@/hooks/useFilterNavigation";
import { cn } from "@/lib/utils";
import type { ApiResponse } from "@/lib/api-types";
import type { AdminApprovals, ApprovalStatus } from "@/services/admin/approvals/types";

const TABS: { value: ApprovalStatus | "ALL"; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "EXECUTED", label: "Done" },
  { value: "FAILED", label: "Failed" },
  { value: "REJECTED", label: "Rejected" },
  { value: "EXPIRED", label: "Expired" },
  { value: "ALL", label: "All" },
];

export function ApprovalsClient({
  status,
  response,
}: {
  status: ApprovalStatus | "ALL";
  response: ApiResponse<AdminApprovals>;
}) {
  const { navigate, isPending } = useFilterNavigation();
  const data = response.success ? response.data : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Approvals"
        description={
          data && !data.enabled
            ? "Four-eyes approval is off (Platform settings → approvals). Requests made while it was on are still here."
            : "Big money moves wait here for a second admin. Requests expire after 24 hours."
        }
      />

      <nav aria-label="Approval status" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 md:mx-0 md:px-0">
        {TABS.map((tab) => {
          const href = `/dashboard/admin/finance/approvals${tab.value === "PENDING" ? "" : `?status=${tab.value}`}`;
          const active = tab.value === status;
          return (
            <Link
              key={tab.value}
              href={href}
              aria-current={active ? "page" : undefined}
              onClick={(e) => {
                e.preventDefault();
                navigate(href);
              }}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface hover:bg-muted",
              )}
            >
              {tab.label}
              {tab.value === "PENDING" && data ? <span className="ml-1.5 tabular-nums opacity-80">{data.pendingCount}</span> : null}
            </Link>
          );
        })}
      </nav>

      {!response.success ? (
        <ErrorState message={response.message} />
      ) : (data?.items ?? []).length === 0 ? (
        <EmptyState icon={UserCheck} title="Nothing here" description={status === "PENDING" ? "No request is waiting." : undefined} />
      ) : (
        <div className={cn("grid gap-3 lg:grid-cols-2", isPending && "opacity-70")} aria-busy={isPending}>
          {data!.items.map((approval) => (
            <ApprovalCard key={approval.id} approval={approval} />
          ))}
        </div>
      )}
    </div>
  );
}
