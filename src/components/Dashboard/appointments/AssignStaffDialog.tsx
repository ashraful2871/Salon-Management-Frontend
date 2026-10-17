"use client";

import { useEffect, useId, useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsiveDialog } from "@/components/Shared/ResponsiveDialog";
import { showResultToast } from "@/components/Shared/showResultToast";
import { getStaffBySalon } from "@/services/staff/getStaffBySalon";
import { getStaffAvailability } from "@/services/staff/getStaffAvailability";
import type { StaffAvailability } from "@/services/staff/schedule-types";
import type { AppointmentStatus, StaffMember } from "@/lib/api-types";
import { cn } from "@/lib/utils";
import type { AppointmentActions } from "./useAppointmentActions";

export type AssignTarget = {
  id: string;
  salonId: string;
  status: AppointmentStatus;
  staffId?: string;
  /** "Haircut · 10:30 AM", for the description. */
  label: string;
};

const initials = (name?: string) =>
  (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

const OFF_LABEL: Record<NonNullable<StaffAvailability["reason"]>, string> = {
  OFF_SHIFT: "Off then",
  TIME_OFF: "On time off",
};

/**
 * Picks who serves a booking. Mount it with `key={target.id}`: the staff list
 * loads once per booking, and the choice starts from whoever has it now.
 * Stylists who are off at the booking's time are shown but can't be picked
 * (the API answers 409 "{name} is off then" anyway).
 */
export const AssignStaffDialog = ({
  target,
  open,
  onOpenChange,
  assign,
}: {
  target: AssignTarget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assign: AppointmentActions["assign"];
}) => {
  const [staff, setStaff] = useState<StaffMember[] | null>(null); // null: loading
  const [offById, setOffById] = useState<Map<string, StaffAvailability["reason"]>>(new Map());
  const [selected, setSelected] = useState(target?.staffId ?? "");
  const radioName = useId();
  const salonId = target?.salonId;
  const appointmentId = target?.id;

  useEffect(() => {
    if (!salonId || !appointmentId) return;
    let live = true;
    Promise.all([getStaffBySalon(salonId), getStaffAvailability(appointmentId)]).then(([res, availability]) => {
      if (!live) return;
      setStaff(res?.success && res.data ? res.data : []);
      // Without availability everyone stays pickable; the API still refuses an off stylist.
      if (availability.success && availability.data) {
        setOffById(new Map(availability.data.filter((a) => !a.working).map((a) => [a.staffId, a.reason])));
      }
      if (!res?.success) {
        showResultToast({ success: false, message: "Failed to fetch staff list" });
      }
    });
    return () => {
      live = false;
    };
  }, [salonId, appointmentId]);

  // The row shows the change at once and spins until the server answers, so
  // the dialog closes now.
  const handleAssign = () => {
    if (!target || !selected) return;
    const member = staff?.find((s) => s.id === selected);
    // Assigning someone confirms a booking that was still waiting.
    const status = target.status === "PENDING" ? "CONFIRMED" : target.status;
    assign(
      target.id,
      selected,
      status,
      member && { id: member.id, user: member.user && { name: member.user.name } },
    );
    onOpenChange(false);
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Assign staff"
      description={target ? `Who serves ${target.label}?` : undefined}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selected || !staff || (offById.has(selected) && selected !== target?.staffId)}
          >
            Assign staff
          </Button>
        </>
      }
    >
      {staff === null ? (
        <div aria-busy="true" aria-label="Loading staff" className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-border p-3">
              <Skeleton className="size-9 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : staff.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
          No staff found
        </p>
      ) : (
        <div role="radiogroup" aria-label="Staff" className="space-y-2">
          {staff.map((member) => {
            const checked = selected === member.id;
            const off = offById.has(member.id) && member.id !== target?.staffId;
            const offReason = offById.get(member.id);
            return (
              <label
                key={member.id}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                  off
                    ? "cursor-not-allowed border-border opacity-60"
                    : checked
                      ? "cursor-pointer border-primary/50 bg-primary-soft"
                      : "cursor-pointer border-border hover:bg-surface-subtle",
                )}
              >
                <input
                  type="radio"
                  name={radioName}
                  value={member.id}
                  checked={checked}
                  disabled={off}
                  onChange={() => setSelected(member.id)}
                  className="sr-only"
                />
                <span
                  aria-hidden="true"
                  className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-subtle text-xs font-semibold text-foreground"
                >
                  {initials(member.user?.name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {member.user?.name || "Unknown"}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {off && offReason ? OFF_LABEL[offReason] : member.designation || "Staff"}
                  </span>
                </span>
                {checked && (
                  <Check aria-hidden="true" className="size-4 shrink-0 text-primary-hover" />
                )}
              </label>
            );
          })}
        </div>
      )}
    </ResponsiveDialog>
  );
};
