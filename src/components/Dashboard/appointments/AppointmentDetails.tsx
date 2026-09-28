"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/Shared/ResponsiveDialog";
import { formatBDT } from "@/lib/money";
import { StatusBadge } from "./StatusBadge";
import { PaymentBadge, hasPaymentBadge } from "./PaymentBadge";
import { TokenPill, type AppointmentRow } from "./AppointmentRow";
import { formatDay } from "./format";

const Item = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3 py-2.5">
    <dt className="text-sm text-muted-foreground">{label}</dt>
    <dd className="min-w-0 break-words text-sm text-foreground">{children}</dd>
  </div>
);

/** Everything about one booking, including what the phone card leaves out. */
export const AppointmentDetails = ({
  row,
  open,
  onOpenChange,
}: {
  row: AppointmentRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => (
  <ResponsiveDialog
    open={open}
    onOpenChange={onOpenChange}
    title={row?.service ?? "Booking"}
    description={
      row &&
      [row.serial !== null ? `#${row.serial}` : null, formatDay(row.date, true), row.time]
        .filter(Boolean)
        .join(" · ")
    }
    footer={
      <Button variant="outline" onClick={() => onOpenChange(false)}>
        Close
      </Button>
    }
  >
    {row && (
      <dl className="divide-y divide-border">
        <Item label="Status">
          <span className="flex flex-wrap gap-1.5">
            <StatusBadge status={row.status} />
            {hasPaymentBadge(row.raw.paymentState) && (
              <PaymentBadge appointment={row.raw} viewer="owner" />
            )}
          </span>
        </Item>
        {row.token && (
          <Item label="Token">
            <TokenPill token={row.token} />
          </Item>
        )}
        <Item label="Customer">
          {row.customer}
          {row.contact && (
            <span className="block text-xs text-muted-foreground">{row.contact}</span>
          )}
        </Item>
        {row.salonName && <Item label="Salon">{row.salonName}</Item>}
        {row.counterName && <Item label="Counter">{row.counterName}</Item>}
        <Item label="Staff">{row.staffName ?? "Not assigned"}</Item>
        {row.duration && <Item label="Duration">{row.duration}</Item>}
        <Item label="Price">
          <span className="font-medium tabular-nums">{formatBDT(row.priceMinor)}</span>
        </Item>
        {row.raw.notes && <Item label="Notes">{row.raw.notes}</Item>}
      </dl>
    )}
  </ResponsiveDialog>
);
