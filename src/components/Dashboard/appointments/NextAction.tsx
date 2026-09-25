"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatBDT } from "@/lib/money";
import type { ApiResponse, Appointment } from "@/lib/api-types";
import { checkInAppointment } from "@/services/appoinments/checkInAppointment";
import { startAppointment } from "@/services/appoinments/startAppointment";
import { recordPayment } from "@/services/appoinments/recordPayment";
import { showResultToast } from "@/components/Shared/showResultToast";
import { CheckoutDialog } from "./CheckoutDialog";
import { COUNTER_PAYMENT_METHODS } from "./format";

// The one thing the desk should do next with a booking, given where it is in
// CONFIRMED -> CHECKED_IN -> (IN_PROGRESS) -> COMPLETED.
export const NextAction = ({
  appointment,
  onDone,
}: {
  appointment: Appointment;
  onDone?: () => void;
}) => {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const run = (
    action: () => Promise<ApiResponse<unknown>>,
    success: string,
    failure: string,
  ) => {
    startTransition(async () => {
      const res = await action();
      showResultToast(res, success, failure);
      if (res.success) {
        onDone?.();
        router.refresh();
      }
    });
  };

  const dueMinor = appointment.amountDueMinor ?? 0;
  const completeLabel =
    dueMinor > 0 ? `Complete & collect ${formatBDT(dueMinor)}` : "Complete";

  switch (appointment.status) {
    case "CONFIRMED":
      return (
        <Button
          size="sm"
          disabled={isPending}
          onClick={() =>
            run(
              () => checkInAppointment(appointment.id),
              "Checked in",
              "Failed to check in",
            )
          }
        >
          {isPending ? "Checking in..." : "Check in"}
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
              onClick={() =>
                run(
                  () => startAppointment(appointment.id),
                  "Service started",
                  "Failed to start",
                )
              }
            >
              Start
            </Button>
          )}
          <Button
            size="sm"
            disabled={isPending}
            onClick={() => setCheckoutOpen(true)}
          >
            {completeLabel}
          </Button>
          <CheckoutDialog
            appointment={appointment}
            open={checkoutOpen}
            onOpenChange={setCheckoutOpen}
            onDone={onDone}
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
              {isPending ? "Recording..." : "Record payment"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {COUNTER_PAYMENT_METHODS.map((m) => (
              <DropdownMenuItem
                key={m.value}
                onClick={() =>
                  run(
                    () => recordPayment(appointment.id, m.value),
                    `Payment recorded · ${m.label}`,
                    "Failed to record payment",
                  )
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
