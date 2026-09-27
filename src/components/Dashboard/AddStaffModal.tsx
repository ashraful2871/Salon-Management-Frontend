"use client";

import React, { useActionState, useId } from "react";

import { ResponsiveDialog } from "@/components/Shared/ResponsiveDialog";
import { showResultToast } from "@/components/Shared/showResultToast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

import { Mail, Scissors, Briefcase, FileText } from "lucide-react";
import { addStaff } from "@/services/staff/addStaff";
import type { ApiResponse } from "@/lib/api-types";

export type AddStaffPayload = {
  salonId: string;
  email: string;
  speciality: string;
  experience: number;
  bio: string;
};

const emptyForm = (salonId: string): AddStaffPayload => ({
  salonId,
  email: "",
  speciality: "",
  experience: 1,
  bio: "",
});

export default function AddStaffModal({
  open,
  setOpen,
  salonId,
  onCreate,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  salonId: string;
  /** The list refreshes itself: the create action sends the updated page back. */
  onCreate?: (payload: AddStaffPayload) => Promise<void> | void;
}) {
  const formId = useId();
  const [form, setForm] = React.useState<AddStaffPayload>(() =>
    emptyForm(salonId),
  );

  // The dialog closes only once the API has answered, so the form stays in
  // view (and editable after a failure) while it saves.
  const [state, formAction, isPending] = useActionState(
    async (
      previous: ApiResponse<null> | null,
      formData: FormData,
    ): Promise<ApiResponse<null>> => {
      const result = await addStaff(previous, formData);
      showResultToast(result, "Staff added", "Failed to add staff.");
      if (result.success) {
        await onCreate?.(form);
        setOpen(false);
        setForm(emptyForm(salonId));
      }
      return result;
    },
    null,
  );

  const update = <K extends keyof AddStaffPayload>(
    key: K,
    value: AddStaffPayload[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const isValid =
    salonId &&
    form.email.trim() &&
    form.speciality.trim() &&
    form.bio.trim() &&
    Number(form.experience) >= 0;

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(next) => !isPending && setOpen(next)}
      title="Add staff member"
      description="They sign in with this email. Fields marked * are required."
      className="sm:max-w-2xl"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form={formId}
            disabled={!isValid}
            loading={isPending}
          >
            Add staff
          </Button>
        </>
      }
    >
      <form id={formId} action={formAction} className="space-y-5">
        {/* The backend needs the salon */}
        <input type="hidden" name="salonId" value={salonId} />

        <div className="grid gap-4 md:grid-cols-2">
          <Field
            icon={<Mail className="h-4 w-4 text-primary" />}
            label="Email *"
          >
            <Input
              name="email"
              type="email"
              inputMode="email"
              autoComplete="off"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="staff@gmail.com"
            />
          </Field>

          <Field
            icon={<Briefcase className="h-4 w-4 text-primary" />}
            label="Experience (years) *"
          >
            <Input
              name="experience"
              type="number"
              inputMode="numeric"
              min={0}
              value={form.experience}
              onChange={(e) => update("experience", Number(e.target.value))}
              placeholder="5"
            />
          </Field>

          <div className="md:col-span-2">
            <Field
              icon={<Scissors className="h-4 w-4 text-primary" />}
              label="Speciality *"
            >
              <Input
                name="speciality"
                value={form.speciality}
                onChange={(e) => update("speciality", e.target.value)}
                placeholder="Hair Styling & Coloring"
              />
            </Field>
          </div>

          <div className="md:col-span-2">
            <Field
              icon={<FileText className="h-4 w-4 text-primary" />}
              label="Bio *"
            >
              <Textarea
                name="bio"
                value={form.bio}
                onChange={(e) => update("bio", e.target.value)}
                placeholder="Expert hair stylist with 5 years of experience"
                className="min-h-[110px]"
              />
            </Field>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface-subtle p-4">
          <p className="mb-2 text-sm font-medium">Preview</p>

          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold leading-none">
                  {form.email?.trim() ? form.email : "staff@gmail.com"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {form.speciality?.trim()
                    ? form.speciality
                    : "Hair Styling & Coloring"}
                </p>
              </div>

              <Badge variant="secondary" className="text-xs">
                Invite
              </Badge>
            </div>

            <Separator className="my-3" />

            <p className="text-sm text-muted-foreground">
              {Number(form.experience) || 0} years experience
            </p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {form.bio?.trim()
                ? form.bio
                : "Expert hair stylist with 5 years of experience"}
            </p>
          </div>
        </div>

        {state?.success === false && state.message && (
          <p className="text-sm text-danger" role="alert">
            {state.message}
          </p>
        )}
      </form>
    </ResponsiveDialog>
  );
}

/* ---------------- Small UI Helpers ---------------- */

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="flex items-center gap-2 text-sm font-medium">
        {icon}
        {label}
      </span>
      {children}
    </label>
  );
}
