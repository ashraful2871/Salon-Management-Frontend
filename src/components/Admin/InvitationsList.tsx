"use client";

import { useState, useTransition } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToneBadge } from "@/components/Shared/ToneBadge";
import { showResultToast } from "@/components/Shared/showResultToast";
import { formatDay } from "@/components/Admin/users/labels";
import type { ApiResponse } from "@/lib/api-types";
import type { InvitationResult, PendingInvitation } from "@/services/admin/agents/types";

/**
 * Pending invitations with Resend and Revoke. `run` wraps each call (the team
 * page passes `useStepUp().run`, since its invitation routes are tier 3).
 */
export function InvitationsList({
  invitations,
  describe,
  onResend,
  onRevoke,
  run = (action) => action(),
}: {
  invitations: PendingInvitation[];
  describe: (invitation: PendingInvitation) => string;
  onResend: (id: string) => Promise<ApiResponse<InvitationResult>>;
  onRevoke: (id: string) => Promise<ApiResponse<{ id: string }>>;
  run?: <T>(action: () => Promise<ApiResponse<T>>) => Promise<ApiResponse<T>>;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [link, setLink] = useState<string | null>(null);

  if (invitations.length === 0) return null;

  const act = (id: string, kind: "resend" | "revoke") =>
    startTransition(async () => {
      setBusy(`${kind}:${id}`);
      if (kind === "resend") {
        const result = await run(() => onResend(id));
        showResultToast(result);
        if (result.success && result.data?.inviteUrl) setLink(result.data.inviteUrl);
      } else {
        showResultToast(await run(() => onRevoke(id)));
      }
      setBusy(null);
    });

  return (
    <Card className="min-w-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Pending invitations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {link && (
          <p className="rounded-lg bg-warning-soft p-3 text-sm break-all">
            The email didn&apos;t go out. Send this link yourself: <span className="font-mono">{link}</span>
          </p>
        )}
        <ul className="divide-y divide-border">
          {invitations.map((inv) => (
            <li key={inv.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <div className="min-w-0">
                  <p className="truncate font-medium">{inv.name ? `${inv.name} · ${inv.email}` : inv.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {describe(inv)} · invited {formatDay(inv.createdAt)}
                    {inv.invitedBy ? ` by ${inv.invitedBy}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {inv.expired ? (
                  <ToneBadge status="EXPIRED" tone="warning">Expired</ToneBadge>
                ) : (
                  <span className="text-xs text-muted-foreground">Expires {formatDay(inv.expiresAt)}</span>
                )}
                <Button size="sm" variant="outline" disabled={!!busy} onClick={() => act(inv.id, "resend")}>
                  {busy === `resend:${inv.id}` ? "Sending…" : "Resend"}
                </Button>
                <Button size="sm" variant="ghost" disabled={!!busy} onClick={() => act(inv.id, "revoke")}>
                  {busy === `revoke:${inv.id}` ? "Revoking…" : "Revoke"}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
