"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useStepUp } from "@/components/Admin/StepUpDialog";
import { formatDhaka } from "@/components/Admin/Timeline";
import { useClock } from "@/components/Admin/useClock";
import { formatDay } from "@/components/Admin/users/labels";
import { DataList, type Column } from "@/components/Shared/DataList";
import { EmptyState } from "@/components/Shared/EmptyState";
import { ErrorState } from "@/components/Shared/ErrorState";
import { FilterBar, type FilterChip } from "@/components/Shared/FilterBar";
import { PageHeader } from "@/components/Shared/PageHeader";
import Pagination from "@/components/Shared/Pagination";
import { PendingRegion } from "@/components/Shared/PendingRegion";
import { humanizeStatus, ToneBadge } from "@/components/Shared/ToneBadge";
import { showResultToast } from "@/components/Shared/showResultToast";
import { FilterNavigationProvider, useFilterNavigation } from "@/hooks/useFilterNavigation";
import { can } from "@/lib/admin-permissions";
import type { HomeListResponse } from "@/services/home-service/request";
import { setHomeReportStatus } from "@/services/home-service/setHomeReportStatus";
import type { AdminHomeReport, HomeReportStatus } from "@/services/home-service/types";
import { REPORT_KIND_LABELS, REPORT_STATUS_LABELS, SIDE_LABELS, waited } from "./labels";

const QUEUE = "QUEUE";
const STATUSES: HomeReportStatus[] = ["OPEN", "REVIEWING", "ACTIONED", "DISMISSED"];
const isOpenStatus = (status: HomeReportStatus) => status === "OPEN" || status === "REVIEWING";

type Props = {
  response: HomeListResponse<AdminHomeReport[]>;
  status?: HomeReportStatus;
  permissions: string[];
};

export function HomeSafetyClient(props: Props) {
  return (
    <FilterNavigationProvider>
      <Safety {...props} />
    </FilterNavigationProvider>
  );
}

function Safety({ response, status, permissions }: Props) {
  const pathname = usePathname();
  const { navigate, isPending } = useFilterNavigation();
  const now = useClock();
  const rows = response.success && Array.isArray(response.data) ? response.data : [];
  const [openId, setOpenId] = useState<string | null>(null);
  const open = rows.find((r) => r.id === openId) ?? null;
  const meta = response.meta;
  const counts = meta?.statusCounts ?? {};

  const go = (next: { status?: string; page?: number }) => {
    const params = new URLSearchParams();
    const shown = "status" in next ? next.status : status;
    if (shown && shown !== QUEUE) params.set("status", shown);
    if (next.page && next.page > 1) params.set("page", String(next.page));
    setOpenId(null);
    const query = params.toString();
    navigate(query ? `${pathname}?${query}` : pathname);
  };

  const chips: FilterChip[] = [
    { value: QUEUE, label: "To handle", count: (counts.OPEN ?? 0) + (counts.REVIEWING ?? 0) },
    ...STATUSES.map((value) => ({ value, label: REPORT_STATUS_LABELS[value], count: counts[value] ?? 0 })),
  ];

  const columns: Column<AdminHomeReport>[] = [
    {
      key: "kind",
      header: "Report",
      mobile: "primary",
      cell: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{REPORT_KIND_LABELS[r.kind]}</p>
          <p className="truncate text-xs text-muted-foreground">{r.details}</p>
        </div>
      ),
    },
    { key: "booking", header: "Visit", mobile: "secondary", cell: (r) => r.booking.code },
    {
      key: "from",
      header: "From",
      className: "hidden @3xl:table-cell",
      cell: (r) => humanizeStatus(r.reporterRole),
    },
    { key: "salon", header: "Salon", className: "hidden @3xl:table-cell", cell: (r) => r.booking.salon.name },
    { key: "waiting", header: "Age", mobile: "eyebrow", cell: (r) => waited(r.createdAt, now) },
    {
      key: "status",
      header: "Status",
      mobile: "trailing",
      cell: (r) => <ToneBadge status={r.status}>{REPORT_STATUS_LABELS[r.status]}</ToneBadge>,
    },
  ];

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Home Service safety"
        description="Reports from customers and experts about a home visit. Oldest first; handle anything about someone's safety straight away."
      />

      <FilterBar
        pending={isPending}
        chips={{
          value: status ?? QUEUE,
          options: chips,
          onChange: (value) => go({ status: value }),
          label: "Status",
        }}
      />

      {!response.success ? (
        <ErrorState title="Couldn't load the reports" message={response.message} />
      ) : (
        <PendingRegion>
          <DataList
            items={rows}
            rowKey={(r) => r.id}
            columns={columns}
            density="compact"
            tableFrom="3xl"
            rowActions={(r) => (
              <Button size="sm" variant={r.status === "OPEN" ? "default" : "outline"} onClick={() => setOpenId(r.id)}>
                Open
              </Button>
            )}
            caption="Safety reports"
            empty={<EmptyState icon={ShieldAlert} title={status ? "No reports here" : "No reports to handle"} />}
          />
        </PendingRegion>
      )}

      {meta && (meta.totalPages ?? 1) > 1 && (
        <Pagination
          page={meta.page}
          totalPages={meta.totalPages ?? 1}
          total={meta.total}
          pageSize={meta.limit}
          itemLabel="reports"
          disabled={isPending}
          onPageChange={(page) => go({ page })}
        />
      )}

      <Sheet open={!!open} onOpenChange={(next) => !next && setOpenId(null)}>
        <SheetContent side="right" className="flex h-dvh w-full max-w-none flex-col gap-0 p-0 sm:max-w-xl">
          {open && (
            <ReportPanel
              key={`${open.id}:${open.status}`}
              report={open}
              canSeeTickets={can(permissions, "support.view")}
              onDone={(leaves) => leaves && setOpenId(null)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

const Fact = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex items-start justify-between gap-4 py-1.5 text-sm">
    <dt className="shrink-0 text-muted-foreground">{label}</dt>
    <dd className="min-w-0 text-right break-words">{children}</dd>
  </div>
);

function ReportPanel({
  report,
  canSeeTickets,
  onDone,
}: {
  report: AdminHomeReport;
  canSeeTickets: boolean;
  onDone: (leaves: boolean) => void;
}) {
  const { run, dialog } = useStepUp();
  const [nextStatus, setNextStatus] = useState<HomeReportStatus>(report.status === "OPEN" ? "REVIEWING" : report.status);
  const [note, setNote] = useState("");
  const [block, setBlock] = useState(false);
  const [days, setDays] = useState("30");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const blockDays = Number(days);
  const daysValid = Number.isInteger(blockDays) && blockDays >= 1 && blockDays <= 365;
  const ready = note.trim().length >= 3 && (!block || daysValid);

  const submit = () => {
    if (!ready) return;
    setError(null);
    startTransition(async () => {
      const result = await run(() =>
        setHomeReportStatus(report.id, {
          status: nextStatus,
          note: note.trim(),
          ...(block ? { blockCustomer: { days: blockDays } } : {}),
        }),
      );
      if (!result.success) {
        setError(result.message);
        return;
      }
      showResultToast(result);
      setNote("");
      setBlock(false);
      onDone(!isOpenStatus(nextStatus));
    });
  };

  return (
    <>
      <SheetHeader className="border-b border-border px-5 py-4 text-left">
        <SheetTitle className="pr-8">{REPORT_KIND_LABELS[report.kind]} report</SheetTitle>
        <SheetDescription>
          From the {report.reporterRole.toLowerCase()} · {formatDhaka(report.createdAt)}
        </SheetDescription>
        <div className="pt-2">
          <ToneBadge status={report.status}>{REPORT_STATUS_LABELS[report.status]}</ToneBadge>
        </div>
      </SheetHeader>

      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
        <blockquote className="rounded-lg bg-surface-subtle px-3 py-2 text-sm whitespace-pre-line">
          {report.details}
        </blockquote>

        <section aria-labelledby="report-visit-title" className="space-y-1">
          <h3 id="report-visit-title" className="text-sm font-semibold">
            The visit
          </h3>
          <dl className="divide-y divide-border">
            <Fact label="Booking">
              <Link
                href={`/dashboard/admin/home-service/bookings/${report.booking.id}`}
                className="text-primary hover:underline"
              >
                {report.booking.code}
              </Link>
            </Fact>
            <Fact label="When">{formatDhaka(report.booking.startAt)}</Fact>
            <Fact label="Side">{SIDE_LABELS[report.booking.audience]}</Fact>
            <Fact label="Status">{humanizeStatus(report.booking.status)}</Fact>
            <Fact label="Salon">{report.booking.salon.name}</Fact>
            <Fact label="Expert">{report.booking.expert.name}</Fact>
            <Fact label="Customer">{report.booking.customer.name}</Fact>
            {report.ticketNumber != null && (
              <Fact label="Support ticket">
                {canSeeTickets && report.supportTicketId ? (
                  <Link href={`/dashboard/admin/support/${report.supportTicketId}`} className="text-primary hover:underline">
                    #{report.ticketNumber}
                  </Link>
                ) : (
                  `#${report.ticketNumber}`
                )}
              </Fact>
            )}
          </dl>
        </section>

        {report.handlerNote && (
          <section className="space-y-1">
            <h3 className="text-sm font-semibold">Last note</h3>
            <p className="text-sm text-muted-foreground">{report.handlerNote}</p>
            {report.handledAt && <p className="text-xs text-muted-foreground">{formatDhaka(report.handledAt)}</p>}
          </section>
        )}

        <section aria-labelledby="report-action-title" className="space-y-3">
          <h3 id="report-action-title" className="text-sm font-semibold">
            Update
          </h3>
          <div className="space-y-1.5">
            <Label htmlFor="report-status">Status</Label>
            <Select value={nextStatus} onValueChange={(v) => setNextStatus(v as HomeReportStatus)}>
              <SelectTrigger id="report-status" className="w-full sm:w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {REPORT_STATUS_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="report-note">Note (required)</Label>
            <Textarea
              id="report-note"
              rows={3}
              maxLength={1000}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What you found and did. Kept on the audit log."
            />
          </div>
          <div className="space-y-2 rounded-xl border border-border p-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                className="size-4 accent-primary"
                checked={block}
                onChange={(e) => setBlock(e.target.checked)}
              />
              Block this customer from Home Service
            </label>
            {report.customerBlockedUntil && (
              <p className="text-xs text-muted-foreground">
                {report.booking.customer.name} is blocked until {formatDay(report.customerBlockedUntil)}. A longer block
                already in place is kept.
              </p>
            )}
            {block && (
              <div className="flex items-center gap-2">
                <Label htmlFor="report-days" className="text-sm">
                  For
                </Label>
                <Input
                  id="report-days"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={365}
                  value={days}
                  aria-invalid={!daysValid}
                  onChange={(e) => setDays(e.target.value)}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">days (1 to 365)</span>
              </div>
            )}
          </div>
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
        </section>
      </div>

      <SheetFooter className="flex-row justify-end gap-2 border-t border-border px-5 py-3">
        <Button disabled={!ready || pending} onClick={submit}>
          {pending && <Loader2 aria-hidden className="animate-spin" />}
          Save
        </Button>
      </SheetFooter>
      {dialog}
    </>
  );
}
