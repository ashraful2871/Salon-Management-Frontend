"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { acceptInvitation } from "@/services/admin/invitations/acceptInvitation";

/** Accept, then the action signs the account out so it signs in with its new role. */
export function AcceptInvitationForm({ token }: { token: string }) {
  const [state, formAction, isPending] = useActionState(acceptInvitation, null);

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
