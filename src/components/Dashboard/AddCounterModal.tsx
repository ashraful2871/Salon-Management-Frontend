"use client";

import React, { useActionState, useId } from "react";

import { ResponsiveDialog } from "@/components/Shared/ResponsiveDialog";
import { showResultToast } from "@/components/Shared/showResultToast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Type, Hash } from "lucide-react";
import { createCounter, AddCounterPayload } from "@/services/counter/createCounter";
import type { ApiResponse } from "@/lib/api-types";

const emptyForm = (salonId: string): AddCounterPayload => ({
  salonId,
  name: "",
  code: "",
});

export default function AddCounterModal({
  open,
  setOpen,
  salonId,
  onCreate,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  salonId: string;
  /** The list refreshes itself: the create action sends the updated page back. */
  onCreate?: () => void;
}) {
  const formId = useId();
  const [form, setForm] = React.useState<AddCounterPayload>(() =>
    emptyForm(salonId),
  );

  // Closes only once the API has answered; a failure keeps the form as typed.
  const [, formAction, isPending] = useActionState(
    async (
      previous: ApiResponse<null> | null,
      formData: FormData,
    ): Promise<ApiResponse<null>> => {
      const result = await createCounter(previous, formData);
      showResultToast(result, "Counter added", "Failed to add counter.");
      if (result.success) {
        onCreate?.();
        setOpen(false);
        setForm(emptyForm(salonId));
      }
      return result;
    },
    null,
  );

  const update = (key: keyof AddCounterPayload, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const isValid = salonId && form.name.trim();

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(next) => !isPending && setOpen(next)}
      title="Add counter"
      description="A chair or station that bookings are made against."
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
            Add counter
          </Button>
        </>
      }
    >
      <form id={formId} action={formAction} className="space-y-4">
        <input type="hidden" name="salonId" value={salonId} />

        <Field
          icon={<Type className="h-4 w-4 text-primary" />}
          label="Counter name *"
        >
          <Input
            name="name"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="e.g. Counter 1, Chair A, VIP Room"
          />
        </Field>

        <Field
          icon={<Hash className="h-4 w-4 text-primary" />}
          label="Counter code (optional)"
        >
          <Input
            name="code"
            value={form.code}
            onChange={(e) => update("code", e.target.value)}
            placeholder="e.g. C-01"
          />
        </Field>
      </form>
    </ResponsiveDialog>
  );
}

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
