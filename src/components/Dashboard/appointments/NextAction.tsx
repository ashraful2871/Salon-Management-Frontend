"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatBDT } from "@/lib/money";
import type { Appointment } from "@/lib/api-types";
import { CheckoutDialog } from "./CheckoutDialog";
import { COUNTER_PAYMENT_METHODS } from "./format";
import type { AppointmentActions } from "./useAppointmentActions";

// The one thing the desk should do next with a booking, given where it is in
// CONFIRMED -> CHECKED_IN -> (IN_PROGRESS) -> COMPLETED. Renders its buttons
// without a wrapper, so the parent's flex row lays them out.
export const NextAction = ({
  appointment,
  actions,
  onDone,
  className,
  hideStart = false,
  compact = false,
}: {
  appointment: Appointment;
  actions: AppointmentActions;
  onDone?: () => unknown;
  /** On each button, e.g. `flex-1` for a full-width card action. */
  className?: string;
  /** Leave Start out (a list puts it in its ⋯ menu instead). */
  hideStart?: boolean;
  /** "Collect ৳150" instead of "Complete & collect ৳150", for a table cell. */
  compact?: boolean;
}) => {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const isPending = actions.isPending(appointment.id);

  const dueMinor = appointment.amountDueMinor ?? 0;
  const completeLabel =
    dueMinor > 0
      ? `${compact ? "Collect" : "Complete & collect"} ${formatBDT(dueMinor)}`
      : "Complete";

  switch (appointment.status) {
    case "CONFIRMED":
      return (
        <Button
          size="sm"
          className={className}
          loading={isPending}
          onClick={() => actions.checkIn(appointment.id, onDone)}
        >
          Check in
        </Button>
      );

    case "CHECKED_IN":
    case "IN_PROGRESS":
      return (
        <>
          {appointment.status === "CHECKED_IN" && !hideStart && (
            <Button
              size="sm"
              variant="outline"
              className={className}
              disabled={isPending}
              onClick={() => actions.start(appointment.id, onDone)}
            >
              Start
            </Button>
          )}
          <Button
            size="sm"
            className={className}
            loading={isPending}
            onClick={() => setCheckoutOpen(true)}
          >
            {completeLabel}
          </Button>
          <CheckoutDialog
            appointment={appointment}
            open={checkoutOpen}
            onOpenChange={setCheckoutOpen}
            onDone={onDone}
            complete={actions.complete}
          />
        </>
      );

    case "COMPLETED":
      // Served, but nobody wrote down what was taken at the counter.
      if (appointment.paymentState !== "UNRECORDED") return null;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className={className}
              loading={isPending}
            >
              Record payment
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {COUNTER_PAYMENT_METHODS.map((m) => (
              <DropdownMenuItem
                key={m.value}
                onClick={() =>
                  actions.recordPayment(appointment.id, m.value, onDone)
                }
              >
                <span className="mr-2" aria-hidden>
                  {m.icon}
                </span>
                {m.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      );

    default:
      return null;
  }
};

/** Whether `NextAction` renders anything for this booking. */
export const hasNextAction = (appointment: Appointment) =>
  appointment.status === "CONFIRMED" ||
  appointment.status === "CHECKED_IN" ||
  appointment.status === "IN_PROGRESS" ||
  (appointment.status === "COMPLETED" &&
    appointment.paymentState === "UNRECORDED");
