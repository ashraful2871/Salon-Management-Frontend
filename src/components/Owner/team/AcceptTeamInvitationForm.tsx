"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { acceptTeamInvitation } from "@/services/team/acceptTeamInvitation";

/** Accept; on success the action swaps in the new session and opens the dashboard. */
export function AcceptTeamInvitationForm({ token }: { token: string }) {
  const [state, formAction, isPending] = useActionState(acceptTeamInvitation, null);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="token" value={token} />
      <Button type="submit" loading={isPending} className="w-full rounded-full font-bold">
        Accept invitation
      </Button>
      <p aria-live="polite" className="min-h-5 text-sm font-medium text-destructive">
        {state && !state.success ? state.message : null}
      </p>
    </form>
  );
}
