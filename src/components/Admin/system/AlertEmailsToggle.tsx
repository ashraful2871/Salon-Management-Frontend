"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { updateAlertEmails } from "@/services/admin/system/updateAlertEmails";

/** The current admin's own "Email me alerts" (system alerts + daily digest). */
export function AlertEmailsToggle({ initial }: { initial: boolean }) {
  const [pending, startTransition] = useTransition();
  const [on, setOn] = useOptimistic(initial);

  const change = (next: boolean) =>
    startTransition(async () => {
      setOn(next);
      const result = await updateAlertEmails(next);
      if (result.success) toast.success(next ? "Alert emails on" : "Alert emails off");
      else toast.error(result.message);
    });

  return (
    <section className="mt-6 flex items-start justify-between gap-4 rounded-2xl border border-border bg-surface p-4">
      <div className="min-w-0">
        <h2 id="alert-emails-label" className="font-heading text-base font-semibold">
          Email me alerts
        </h2>
        <p className="text-sm text-muted-foreground">
          One email when a system check starts failing and one when it recovers, plus the daily digest after 08:00.
        </p>
      </div>
      <Switch
        checked={on}
        onCheckedChange={change}
        disabled={pending}
        aria-labelledby="alert-emails-label"
      />
    </section>
  );
}
