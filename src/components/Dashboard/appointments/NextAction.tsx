"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
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
// CONFIRMED -> CHECKED_IN -> (IN_PROGRESS) -> COMPLETED.
export const NextAction = ({
  appointment,
  actions,
  onDone,
}: {
  appointment: Appointment;
  actions: AppointmentActions;
  onDone?: () => unknown;
}) => {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const isPending = actions.isPending(appointment.id);
  const spinner = isPending && (
    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
  );

  const dueMinor = appointment.amountDueMinor ?? 0;
  const completeLabel =
    dueMinor > 0 ? `Complete & collect ${formatBDT(dueMinor)}` : "Complete";

  switch (appointment.status) {
    case "CONFIRMED":
      return (
        <Button
          size="sm"
          disabled={isPending}
          onClick={() => actions.checkIn(appointment.id, onDone)}
        >
          {spinner}
          Check in
        </Button>
      );

    case "CHECKED_IN":
    case "IN_PROGRESS":
      return (
        <div className="flex flex-wrap items-center gap-2">
          {appointment.status === "CHECKED_IN" && (
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => actions.start(appointment.id, onDone)}
            >
              Start
            </Button>
          )}
          <Button
            size="sm"
            disabled={isPending}
            onClick={() => setCheckoutOpen(true)}
          >
            {spinner}
            {completeLabel}
          </Button>
          <CheckoutDialog
            appointment={appointment}
            open={checkoutOpen}
            onOpenChange={setCheckoutOpen}
            onDone={onDone}
            complete={actions.complete}
          />
        </div>
      );

    case "COMPLETED":
      // Served, but nobody wrote down what was taken at the counter.
      if (appointment.paymentState !== "UNRECORDED") return null;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" disabled={isPending}>
              {spinner}
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
