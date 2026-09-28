"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/Shared/ConfirmDialog";
import { AssignStaffDialog, type AssignTarget } from "./AssignStaffDialog";
import { AppointmentDetails } from "./AppointmentDetails";
import type { AppointmentRow } from "./AppointmentRow";
import { formatDay } from "./format";
import type { AppointmentActions } from "./useAppointmentActions";

/**
 * The Cancel, Assign staff and View details dialogs behind a list's rows,
 * acting through that list's own `actions` so its row changes at once. Render
 * `dialogs` once, next to the list.
 */
export const useBookingDialogs = ({
  actions,
  rows,
  isCustomer = false,
}: {
  actions: AppointmentActions;
  rows: AppointmentRow[];
  isCustomer?: boolean;
}) => {
  // Each dialog keeps its row after closing, so the text doesn't blank while
  // it fades out.
  const [cancelRow, setCancelRow] = useState<AppointmentRow | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<AssignTarget | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [viewRow, setViewRow] = useState<AppointmentRow | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  // The details follow the row while it changes underneath them.
  const viewing = rows.find((r) => r.id === viewRow?.id) ?? viewRow;

  const openCancel = (row: AppointmentRow) => {
    setCancelRow(row);
    setCancelOpen(true);
  };
  // The row shows Cancelled at once (and goes back, with an error toast, if
  // the API refuses), so the dialog has nothing left to wait for.
  const confirmCancel = () => {
    if (cancelRow) actions.cancel(cancelRow.id);
    setCancelOpen(false);
  };
  const openAssign = (row: AppointmentRow) => {
    if (!row.salonId) return;
    setAssignTarget({
      id: row.id,
      salonId: row.salonId,
      status: row.status,
      staffId: row.raw.staff?.id,
      label: `${row.service} at ${row.time}`,
    });
    setAssignOpen(true);
  };
  const openView = (row: AppointmentRow) => {
    setViewRow(row);
    setViewOpen(true);
  };

  const dialogs = (
    <>
      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        tone="danger"
        title="Cancel this booking?"
        description={
          cancelRow && (
            <>
              <span className="font-medium text-foreground">
                {cancelRow.serial !== null && `#${cancelRow.serial} · `}
                {cancelRow.service}
              </span>{" "}
              on {formatDay(cancelRow.date)} at {cancelRow.time}
              {isCustomer
                ? ". This can't be undone."
                : ` for ${cancelRow.customer}. Their deposit goes back to their wallet in full, with a goodwill credit.`}
            </>
          )
        }
        confirmLabel="Cancel booking"
        onConfirm={confirmCancel}
      />

      {assignTarget && (
        <AssignStaffDialog
          key={assignTarget.id}
          target={assignTarget}
          open={assignOpen}
          onOpenChange={setAssignOpen}
          assign={actions.assign}
        />
      )}

      {!isCustomer && (
        <AppointmentDetails row={viewing} open={viewOpen} onOpenChange={setViewOpen} />
      )}
    </>
  );

  return { openCancel, openAssign, openView, dialogs };
};
