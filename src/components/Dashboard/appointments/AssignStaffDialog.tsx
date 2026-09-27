"use client";

import { useEffect, useId, useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsiveDialog } from "@/components/Shared/ResponsiveDialog";
import { showResultToast } from "@/components/Shared/showResultToast";
import { getStaffBySalon } from "@/services/staff/getStaffBySalon";
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

/**
 * Picks who serves a booking. Mount it with `key={target.id}`: the staff list
 * loads once per booking, and the choice starts from whoever has it now.
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
  const [selected, setSelected] = useState(target?.staffId ?? "");
  const radioName = useId();
  const salonId = target?.salonId;

  useEffect(() => {
    if (!salonId) return;
    let live = true;
    getStaffBySalon(salonId).then((res) => {
      if (!live) return;
      setStaff(res?.success && res.data ? res.data : []);
      if (!res?.success) {
        showResultToast({ success: false, message: "Failed to fetch staff list" });
      }
    });
    return () => {
      live = false;
    };
  }, [salonId]);

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
          <Button onClick={handleAssign} disabled={!selected || !staff}>
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
            return (
              <label
                key={member.id}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                  checked
                    ? "border-primary/50 bg-primary-soft"
                    : "border-border hover:bg-surface-subtle",
                )}
              >
                <input
                  type="radio"
                  name={radioName}
                  value={member.id}
                  checked={checked}
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
                    {member.designation || "Staff"}
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
