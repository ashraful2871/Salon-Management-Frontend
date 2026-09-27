"use client";

import { useCallback, useOptimistic, useRef, useState, useTransition } from "react";
import type {
  ApiResponse,
  Appointment,
  AppointmentStatus,
  CheckoutReceipt,
  CounterPaymentMethod,
} from "@/lib/api-types";
import { formatBDT } from "@/lib/money";
import { cancelAppointment } from "@/services/appoinments/cancelAppointment";
import { checkInAppointment } from "@/services/appoinments/checkInAppointment";
import { checkoutAppointment } from "@/services/appoinments/checkoutAppointment";
import { recordPayment } from "@/services/appoinments/recordPayment";
import { startAppointment } from "@/services/appoinments/startAppointment";
import { updateAppointmentStatus } from "@/services/appoinments/updateAppointmentStatus";
import { showResultToast } from "@/components/Shared/showResultToast";
import { paymentMethodLabel } from "./format";

type Patch = Partial<Appointment>;
type Patches = Record<string, Patch>;
const NO_PATCHES: Patches = {};

export type CheckoutPayload = Parameters<typeof checkoutAppointment>[1];

/** Runs after a successful action, before its optimistic change is dropped. */
type OnDone = () => unknown;

/**
 * The desk's appointment actions. Each one changes its row at once, spins only
 * that row, and leaves the rest usable. The server action's response carries
 * the re-rendered page, so nothing refreshes afterwards.
 */
export const useAppointmentActions = () => {
  // Patches by booking id. They last while their action is in flight and drop
  // when it ends: by then the response has brought the server's version of the
  // row, or, when the action failed, the row simply goes back to how it was.
  const [patches, addPatch] = useOptimistic(
    NO_PATCHES,
    (current: Patches, change: { id: string; patch: Patch }) => ({
      ...current,
      [change.id]: { ...current[change.id], ...change.patch },
    }),
  );
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [, startTransition] = useTransition();
  // State only disables a button after a re-render; this closes the gap so a
  // fast double click still sends one request.
  const inFlight = useRef(new Set<string>());

  /** Lays the in-flight changes over a list from the server. */
  const withPending = useCallback(
    <T extends Appointment>(list: T[]): T[] =>
      patches === NO_PATCHES
        ? list
        : list.map((a) => (patches[a.id] ? { ...a, ...patches[a.id] } : a)),
    [patches],
  );

  const run = <T>(
    id: string,
    patch: Patch,
    action: () => Promise<ApiResponse<T>>,
    report: (res: ApiResponse<T>) => void,
    onDone?: OnDone,
  ) => {
    if (inFlight.current.has(id)) return;
    inFlight.current.add(id);
    setPendingIds((ids) => [...ids, id]);

    startTransition(async () => {
      addPatch({ id, patch });
      try {
        const res = await action();
        report(res);
        if (res.success) await onDone?.();
      } catch {
        report({ success: false, message: "" });
      } finally {
        inFlight.current.delete(id);
        setPendingIds((ids) => ids.filter((pending) => pending !== id));
      }
    });
  };

  const cancel = (id: string) =>
    run(id, { status: "CANCELLED" }, () => cancelAppointment(id), (res) =>
      showResultToast(res, "Appointment cancelled successfully", "Failed to cancel appointment"),
    );

  const checkIn = (id: string, onDone?: OnDone) =>
    run(
      id,
      { status: "CHECKED_IN" },
      () => checkInAppointment(id),
      (res) => showResultToast(res, "Checked in", "Failed to check in"),
      onDone,
    );

  const assign = (
    id: string,
    staffId: string,
    status: AppointmentStatus,
    staff?: Appointment["staff"],
  ) =>
    run(
      id,
      { status, ...(staff && { staff }) },
      () => updateAppointmentStatus(id, status, staffId),
      (res) => showResultToast(res, "Staff assigned successfully", "Failed to assign staff"),
    );

  const start = (id: string, onDone?: OnDone) =>
    run(
      id,
      { status: "IN_PROGRESS" },
      () => startAppointment(id),
      (res) => showResultToast(res, "Service started", "Failed to start"),
      onDone,
    );

  const complete = (
    appointment: Appointment,
    payload: CheckoutPayload,
    onDone?: OnDone,
  ) => {
    const dueMinor = appointment.amountDueMinor ?? 0;
    run(
      appointment.id,
      dueMinor > 0
        ? { status: "COMPLETED", amountDueMinor: 0, paymentState: "PAID" }
        : { status: "COMPLETED" },
      () => checkoutAppointment(appointment.id, payload),
      (res: ApiResponse<CheckoutReceipt>) =>
        showResultToast(
          res,
          dueMinor === 0
            ? "Booking completed"
            : `Collected ${formatBDT(res.data?.collectedMinor ?? dueMinor)} · booking completed`,
          "Failed to complete the booking",
        ),
      onDone,
    );
  };

  const recordCounterPayment = (
    id: string,
    method: CounterPaymentMethod,
    onDone?: OnDone,
  ) =>
    run(
      id,
      { paymentState: "PAID" },
      () => recordPayment(id, method),
      (res) =>
        showResultToast(
          res,
          `Payment recorded · ${paymentMethodLabel(method)}`,
          "Failed to record payment",
        ),
      onDone,
    );

  return {
    withPending,
    /** The booking acted on most recently that is still in flight, or null. */
    pendingId: pendingIds.at(-1) ?? null,
    isPending: (id: string) => pendingIds.includes(id),
    cancel,
    checkIn,
    assign,
    start,
    complete,
    recordPayment: recordCounterPayment,
  };
};

export type AppointmentActions = ReturnType<typeof useAppointmentActions>;
