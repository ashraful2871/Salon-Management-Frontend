"use client";

import { useOptimistic, useState, useTransition, type KeyboardEvent, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronUp, ExternalLink, FileText, Loader2, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ReasonDialog, type ReasonCode } from "@/components/Admin/ReasonDialog";
import { formatDay, reasonText } from "@/components/Admin/users/labels";
import { waitingFor } from "@/components/Admin/salons/labels";
import { DataList, type Column } from "@/components/Shared/DataList";
import { EmptyState } from "@/components/Shared/EmptyState";
import { ErrorState } from "@/components/Shared/ErrorState";
import { FilterBar, type FilterChip } from "@/components/Shared/FilterBar";
import { PageHeader } from "@/components/Shared/PageHeader";
import Pagination from "@/components/Shared/Pagination";
import { PendingRegion } from "@/components/Shared/PendingRegion";
import { ToneBadge, humanizeStatus } from "@/components/Shared/ToneBadge";
import { showResultToast } from "@/components/Shared/showResultToast";
import {
  FilterNavigationProvider,
  useFilterNavigation,
} from "@/hooks/useFilterNavigation";
import { can } from "@/lib/admin-permissions";
import type { ApiResponse } from "@/lib/api-types";
import { decideApplication } from "@/services/admin/applications/decideApplication";
import type {
  AdminApplication,
  AdminApplicationFilters,
  AdminApplicationListMeta,
  ApplicationStatus,
} from "@/services/admin/applications/types";

const ALL = "ALL";

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

const REJECT_REASONS: ReasonCode[] = [
  { value: "Business details are incomplete", label: "Business details are incomplete" },
  { value: "The document is missing or unreadable", label: "The document is missing or unreadable" },
  { value: "We could not verify the business", label: "We could not verify the business" },
  { value: "This business already has an owner account", label: "Duplicate application" },
  { value: "OTHER", label: "Other" },
];

const Fact = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex items-start justify-between gap-4 py-1.5 text-sm">
    <dt className="shrink-0 text-muted-foreground">{label}</dt>
    <dd className="min-w-0 text-right break-words">{children}</dd>
  </div>
);

type Props = {
  response: ApiResponse<AdminApplication[]>;
  filters: AdminApplicationFilters;
  permissions: string[];
};

export function ApplicationsClient(props: Props) {
  return (
    <FilterNavigationProvider>
      <ApplicationsList {...props} />
    </FilterNavigationProvider>
  );
}

function ApplicationsList({ response, filters, permissions }: Props) {
  const pathname = usePathname();
  const { navigate, isPending } = useFilterNavigation();
  const [search, setSearch] = useState(filters.search ?? "");
  const [openId, setOpenId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<AdminApplication | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const applications = response.success && Array.isArray(response.data) ? response.data : [];
  const [rows, setOptimistic] = useOptimistic(
    applications,
    (state, { id, status }: { id: string; status: ApplicationStatus }) =>
      state.map((a) => (a.id === id ? { ...a, applicationStatus: status } : a)),
  );
  const meta = response.meta as unknown as AdminApplicationListMeta | undefined;
  const counts = meta?.statusCounts ?? {};
  const allCount = Object.values(counts).reduce((sum, n) => sum + (n ?? 0), 0);
  const canReview = can(permissions, "salons.review");

  const position = openId ? rows.findIndex((a) => a.id === openId) : -1;
  const open = position >= 0 ? rows[position] : null;
  const decidable = !!open && open.applicationStatus !== "APPROVED";

  const go = (next: Partial<AdminApplicationFilters>) => {
    const merged: AdminApplicationFilters = { ...filters, page: 1, ...next };
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(merged)) {
      if (value === undefined || value === "" || (key === "page" && value === 1)) continue;
      params.set(key, String(value));
    }
    setOpenId(null);
    const query = params.toString();
    navigate(query ? `${pathname}?${query}` : pathname);
  };

  const chips: FilterChip[] = [
    ...(["PENDING", "APPROVED", "REJECTED"] as ApplicationStatus[]).map((status) => ({
      value: status,
      label: STATUS_LABELS[status],
      count: counts[status] ?? 0,
    })),
    { value: ALL, label: "All", count: allCount },
  ];

  const step = (delta: 1 | -1) => {
    const next = rows[position + delta];
    if (next) setOpenId(next.id);
  };

  const advanceFrom = (id: string) => {
    const at = rows.findIndex((a) => a.id === id);
    const next = rows[at + 1] ?? rows[at - 1];
    setOpenId(next && next.id !== id ? next.id : null);
  };

  const approve = (application: AdminApplication) => {
    setPendingId(application.id);
    startTransition(async () => {
      setOptimistic({ id: application.id, status: "APPROVED" });
      const result = await decideApplication(application.id, { approve: true });
      showResultToast(result);
      setPendingId((current) => (current === application.id ? null : current));
      if (result.success && filters.status === "PENDING") advanceFrom(application.id);
    });
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const el = e.target as HTMLElement;
    if (!open || e.altKey || e.ctrlKey || e.metaKey || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)) return;
    const key = e.key.toLowerCase();
    if (key === "j") step(1);
    else if (key === "k") step(-1);
    else if (key === "a" && canReview && open.applicationStatus === "PENDING" && pendingId !== open.id) approve(open);
    else return;
    e.preventDefault();
  };

  const columns: Column<AdminApplication>[] = [
    {
      key: "business",
      header: "Business",
      mobile: "primary",
      cell: (a) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{a.businessName || "Unnamed business"}</p>
          <p className="truncate text-xs text-muted-foreground">{a.businessAddress || "No address"}</p>
        </div>
      ),
    },
    {
      key: "applicant",
      header: "Applicant",
      mobile: "secondary",
      cell: (a) => (
        <div className="min-w-0">
          <p className="truncate">{a.user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{a.user.email}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      mobile: "trailing",
      cell: (a) => <ToneBadge status={a.applicationStatus}>{STATUS_LABELS[a.applicationStatus]}</ToneBadge>,
    },
    {
      key: "document",
      header: "Document",
      className: "hidden @3xl:table-cell",
      cell: (a) => (a.documentUrl ? "Attached" : "—"),
    },
    {
      key: "createdAt",
      header: filters.status === "PENDING" ? "Waiting" : "Applied",
      mobile: "eyebrow",
      cell: (a) => (a.applicationStatus === "PENDING" ? waitingFor(a.createdAt) : formatDay(a.createdAt)),
    },
  ];

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Owner applications"
        description="People asking to list a salon. Approving makes them a salon owner; each salon they add is reviewed separately."
      />

      <FilterBar
        pending={isPending}
        search={{
          value: search,
          onChange: setSearch,
          onSubmit: (value) => go({ search: value.trim() || undefined }),
          placeholder: "Business, phone, applicant name or email",
          label: "Search applications",
        }}
        chips={{
          value: filters.status ?? ALL,
          options: chips,
          onChange: (status) => go({ status }),
          label: "Status",
        }}
      />

      {!response.success ? (
        <ErrorState title="Couldn't load applications" message={response.message} />
      ) : (
        <PendingRegion>
          <DataList
            items={rows}
            rowKey={(a) => a.id}
            columns={columns}
            density="compact"
            rowActions={(a) => (
              <Button
                size="sm"
                variant={a.applicationStatus === "PENDING" ? "default" : "outline"}
                onClick={() => setOpenId(a.id)}
              >
                Review
              </Button>
            )}
            caption="Owner applications"
            empty={
              <EmptyState
                icon={Scissors}
                title={filters.status === "PENDING" ? "Nothing waiting for review" : "No applications match"}
                description={filters.search ? "Try another search." : undefined}
              />
            }
          />
        </PendingRegion>
      )}

      {meta && meta.totalPages > 1 && (
        <Pagination
          page={meta.page}
          totalPages={meta.totalPages}
          total={meta.total}
          pageSize={meta.limit}
          itemLabel="applications"
          disabled={isPending}
          onPageChange={(page) => go({ ...filters, page })}
        />
      )}

      <Sheet open={!!open} onOpenChange={(next) => !next && setOpenId(null)}>
        <SheetContent
          side="right"
          onKeyDown={onKeyDown}
          className="flex h-dvh w-full max-w-none flex-col gap-0 p-0 sm:max-w-xl"
        >
          {open && (
            <>
              <SheetHeader className="border-b border-border px-5 py-4 text-left">
                <SheetTitle className="truncate pr-8">{open.businessName || "Unnamed business"}</SheetTitle>
                <SheetDescription>
                  Applied {formatDay(open.createdAt)} by {open.user.name}
                </SheetDescription>
                <div className="flex items-center justify-between gap-2 pt-2">
                  <ToneBadge status={open.applicationStatus}>{STATUS_LABELS[open.applicationStatus]}</ToneBadge>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span>
                      {position + 1} of {rows.length}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      aria-label="Previous application (K)"
                      disabled={position <= 0}
                      onClick={() => step(-1)}
                    >
                      <ChevronUp className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      aria-label="Next application (J)"
                      disabled={position >= rows.length - 1}
                      onClick={() => step(1)}
                    >
                      <ChevronDown className="size-4" />
                    </Button>
                  </div>
                </div>
              </SheetHeader>

              <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
                <section className="space-y-1">
                  <h3 className="text-sm font-semibold">Business</h3>
                  <dl className="divide-y divide-border">
                    <Fact label="Name">{open.businessName || "—"}</Fact>
                    <Fact label="Address">{open.businessAddress || "—"}</Fact>
                    <Fact label="Phone">{open.businessPhone || "—"}</Fact>
                    <Fact label="Email">{open.businessEmail || "—"}</Fact>
                  </dl>
                </section>

                <section className="space-y-2">
                  <h3 className="text-sm font-semibold">Document</h3>
                  {open.documentUrl ? (
                    <a
                      href={open.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                    >
                      <FileText aria-hidden className="size-4" />
                      Open the document
                      <ExternalLink aria-hidden className="size-3.5" />
                    </a>
                  ) : (
                    <p className="text-sm text-muted-foreground">No document attached.</p>
                  )}
                </section>

                <section className="space-y-1">
                  <h3 className="text-sm font-semibold">Applicant account</h3>
                  <dl className="divide-y divide-border">
                    <Fact label="Name">
                      {can(permissions, "users.view") ? (
                        <Link href={`/dashboard/admin/users/${open.user.id}`} className="text-primary hover:underline">
                          {open.user.name}
                        </Link>
                      ) : (
                        open.user.name
                      )}
                    </Fact>
                    <Fact label="Email">{open.user.email}</Fact>
                    <Fact label="Phone">{open.user.phone ?? "—"}</Fact>
                    <Fact label="Account type">{humanizeStatus(open.user.role)}</Fact>
                    <Fact label="Account">
                      <ToneBadge status={open.user.status} />
                    </Fact>
                    <Fact label="Joined">{formatDay(open.user.createdAt)}</Fact>
                  </dl>
                </section>

                {open.rejectionReason && (
                  <section className="space-y-1">
                    <h3 className="text-sm font-semibold">Rejection reason</h3>
                    <p className="text-sm text-muted-foreground">{open.rejectionReason}</p>
                  </section>
                )}
              </div>

              {canReview && decidable && (
                <SheetFooter className="flex-row gap-2 border-t border-border px-5 py-3">
                  <p className="mr-auto hidden self-center text-xs text-muted-foreground sm:block">
                    <kbd className="rounded border px-1">J</kbd>/<kbd className="rounded border px-1">K</kbd> move ·{" "}
                    <kbd className="rounded border px-1">A</kbd> approve
                  </p>
                  {open.applicationStatus === "PENDING" && (
                    <Button variant="outline" disabled={pendingId === open.id} onClick={() => setRejecting(open)}>
                      Reject…
                    </Button>
                  )}
                  <Button disabled={pendingId === open.id} onClick={() => approve(open)}>
                    {pendingId === open.id && <Loader2 aria-hidden className="animate-spin" />}
                    Approve
                  </Button>
                </SheetFooter>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>

      {rejecting && (
        <ReasonDialog
          open
          onOpenChange={(next) => !next && setRejecting(null)}
          title={`Reject ${rejecting.businessName || "this application"}`}
          description="The applicant gets the reason by email and can apply again."
          reasonCodes={REJECT_REASONS}
          showNotify={false}
          tone="danger"
          confirmLabel="Reject"
          onConfirm={(input) => {
            setOptimistic({ id: rejecting.id, status: "REJECTED" });
            return decideApplication(rejecting.id, {
              approve: false,
              rejectionReason: reasonText(REJECT_REASONS, input),
            });
          }}
          onDone={(result) => {
            showResultToast(result);
            if (result.success && filters.status === "PENDING") advanceFrom(rejecting.id);
          }}
        />
      )}
    </div>
  );
}
