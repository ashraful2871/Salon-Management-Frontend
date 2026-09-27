"use client";

import { useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Appointment } from "@/lib/api-types";
import { lookupAppointmentByToken } from "@/services/appoinments/lookupAppointmentByToken";
import { showResultToast } from "@/components/Shared/showResultToast";
import { StatusBadge } from "./StatusBadge";
import { PaymentBadge } from "./PaymentBadge";
import { NextAction } from "./NextAction";
import { dhakaToday, formatDay, formatTime12 } from "./format";
import { useAppointmentActions } from "./useAppointmentActions";

// For the customer who walks up and reads out their token.
export const TokenLookup = () => {
  const [token, setToken] = useState("");
  const [found, setFound] = useState<Appointment | null>(null);
  const [isPending, startTransition] = useTransition();
  const actions = useAppointmentActions();
  // The card with any change still in flight laid over it.
  const shown = found ? actions.withPending([found])[0] : null;

  // The card is local state, so it is re-read after acting on it. The action
  // waits for this, so the card never flicks back to the old status.
  const reread = async (value: string) => {
    const res = await lookupAppointmentByToken(value.trim());
    if (res.success && res.data) setFound(res.data);
  };

  const lookup = (value: string) => {
    const t = value.trim();
    if (!t) return;
    startTransition(async () => {
      const res = await lookupAppointmentByToken(t);
      if (res.success && res.data) {
        setFound(res.data);
      } else {
        setFound(null);
        showResultToast(res, undefined, "No booking found for that token");
      }
    });
  };

  const day = found ? found.appointmentDate.slice(0, 10) : null;
  const name = found?.customer?.name?.trim() || found?.customer?.email || "Unknown";

  return (
    <section
      aria-label="Find a booking by token"
      className="space-y-4 rounded-2xl border border-border bg-surface p-4"
    >
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          lookup(token);
        }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Enter token, e.g. 7KQ2M"
            aria-label="Booking token"
            className="rounded-full bg-surface pl-9 font-mono uppercase placeholder:normal-case placeholder:font-sans"
          />
        </div>
        <Button type="submit" loading={isPending} disabled={!token.trim()}>
          Find
        </Button>
      </form>

      {found && shown && (
        <div className="space-y-3 rounded-xl border border-border bg-surface-subtle p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-md bg-primary-soft px-2 font-bold text-primary-hover tabular-nums">
                {found.serialNumber != null ? `#${found.serialNumber}` : "—"}
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold text-foreground">
                  {found.service?.name ?? "Service"}
                  {found.counter?.name && ` · ${found.counter.name}`}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatTime12(found.startTime)}
                  {day && day !== dhakaToday() && ` · ${formatDay(day)}`}
                  {" · "}
                  {name}
                  {found.customer?.phone && ` (${found.customer.phone})`}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Clear"
              onClick={() => {
                setFound(null);
                setToken("");
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={shown.status} />
              <PaymentBadge appointment={shown} viewer="owner" />
              {found.token && (
                <span className="text-[11px] font-mono font-semibold tracking-wider text-muted-foreground">
                  {found.token}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <NextAction
                appointment={shown}
                actions={actions}
                onDone={() => reread(found.token ?? token)}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
