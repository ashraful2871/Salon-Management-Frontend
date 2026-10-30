"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarCheck, History } from "lucide-react";

import { DataList, type Column } from "@/components/Shared/DataList";
import { EmptyState } from "@/components/Shared/EmptyState";
import Pagination from "@/components/Shared/Pagination";
import { ToneBadge } from "@/components/Shared/ToneBadge";
import { Button } from "@/components/ui/button";
import { useFilterNavigation } from "@/hooks/useFilterNavigation";
import { homeBookingPath } from "@/lib/booking-resume";
import { formatBDT } from "@/lib/money";
import type { HomeBookingSummary, HomeMyBookingsTab } from "@/services/home-service/types";
import { dayOf, dayText, HOME_STATUS_LABEL, timeText } from "../booking/format";
import HomeBookingSheet, { type SheetTarget } from "./HomeBookingSheet";

const whenOf = (b: HomeBookingSummary) => `${dayText(dayOf(b.startAt))} · ${timeText(b.startAt)}`;

/** The advance: paid, then whatever came back and whatever was kept. */
const advanceOf = (b: HomeBookingSummary) => {
  if (b.status === "PENDING_PAYMENT") return `Advance ${formatBDT(b.advanceMinor)} to pay`;
  if (b.status === "EXPIRED") return "Not paid";
  const refunded = b.refundedMinor ?? 0;
  return [
    `Advance ${formatBDT(b.advanceMinor)} paid`,
    refunded > 0 && `${formatBDT(refunded)} refunded`,
    b.feeMinor > 0 && `${formatBDT(b.feeMinor)} kept`,
  ]
    .filter(Boolean)
    .join(" · ");
};

const COLUMNS: Column<HomeBookingSummary>[] = [
  {
    key: "code",
    header: "Booking",
    mobile: "eyebrow",
    cell: (b) => <span className="font-mono text-sm font-semibold">{b.code}</span>,
    mobileCell: (b) => b.code,
  },
  { key: "when", header: "When", mobile: "eyebrow", cell: whenOf },
  { key: "services", header: "Services", mobile: "primary", cell: (b) => b.services.join(", ") },
  { key: "expert", header: "Expert", mobile: "secondary", cell: (b) => b.expert.name },
  { key: "advance", header: "Advance", mobile: "meta", cell: advanceOf },
  {
    key: "status",
    header: "Status",
    mobile: "trailing",
    cell: (b) => <ToneBadge status={b.status}>{HOME_STATUS_LABEL[b.status]}</ToneBadge>,
  },
];

/** A tab of the customer's visits. A row opens over the list; one not paid yet goes to its pay page. */
export default function HomeBookingsList({
  bookings,
  tab,
  page,
  totalPages,
  total,
  pageSize,
  walletMinor,
}: {
  bookings: HomeBookingSummary[];
  tab: HomeMyBookingsTab;
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  walletMinor: number;
}) {
  const { navigate, isPending } = useFilterNavigation();
  const [target, setTarget] = useState<SheetTarget | null>(null);
  const [open, setOpen] = useState(false);

  const openRow = (id: string) => {
    setTarget((t) => ({ id, opening: (t?.opening ?? 0) + 1 }));
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <DataList
        items={bookings}
        rowKey={(b) => b.id}
        columns={COLUMNS}
        caption={tab === "upcoming" ? "Upcoming home visits" : "Past home visits"}
        tableFrom="3xl"
        rowActions={(b) =>
          b.status === "PENDING_PAYMENT" ? (
            <Button size="sm" asChild>
              <Link href={homeBookingPath(b.id)}>Pay now</Link>
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => openRow(b.id)}>
              View
            </Button>
          )
        }
        empty={
          tab === "upcoming" ? (
            <EmptyState
              icon={CalendarCheck}
              title="No home visits coming up"
              description="Book an expert to come to you."
              action={
                <Button asChild>
                  <Link href="/home-service">Book a home visit</Link>
                </Button>
              }
            />
          ) : (
            <EmptyState icon={History} title="No past home visits" description="Visits you've finished or cancelled show here." />
          )
        }
      />
      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={pageSize}
          itemLabel="visits"
          disabled={isPending}
          onPageChange={(p) => navigate(`/dashboard/home-bookings?tab=${tab}&page=${p}`, { scroll: true })}
        />
      )}
      <HomeBookingSheet target={target} open={open} onOpenChange={setOpen} walletMinor={walletMinor} />
    </div>
  );
}
