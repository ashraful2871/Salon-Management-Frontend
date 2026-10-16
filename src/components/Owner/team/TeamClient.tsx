"use client";

import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import { MailPlus, MoreHorizontal, RotateCw, UserPlus, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataList, type Column } from "@/components/Shared/DataList";
import { ConfirmDialog } from "@/components/Shared/ConfirmDialog";
import { EmptyState } from "@/components/Shared/EmptyState";
import { ToneBadge } from "@/components/Shared/ToneBadge";
import { InviteMemberDialog } from "./InviteMemberDialog";
import { removeMember, setManagerCanEditServices, updateMember } from "@/services/team/memberActions";
import { resendInvitation, revokeInvitation } from "@/services/team/invitationActions";
import {
  ROLE_LABEL,
  type BranchRole,
  type TeamInvitation,
  type TeamMember,
} from "@/services/team/team-types";

const dateFmt = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "Asia/Dhaka" });
const fmt = (iso: string) => dateFmt.format(new Date(iso));

const ALL_ROLES: BranchRole[] = ["MANAGER", "RECEPTIONIST", "STYLIST"];

type MemberPatch =
  | { id: string; kind: "update"; role?: BranchRole; status?: "ACTIVE" | "SUSPENDED" }
  | { id: string; kind: "remove" };

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/**
 * One branch's team: members (role, suspend, remove), pending invitations
 * (resend, revoke) and the invite dialog. A manager hands out receptionist and
 * stylist seats only and never touches a manager; nobody acts on their own
 * seat. The API enforces all of it - this only hides what would be refused.
 */
export function TeamClient({
  salonId,
  salonName,
  isOwner,
  meUserId,
  members,
  invitations,
  managerCanEditServices,
}: {
  salonId: string;
  salonName: string;
  isOwner: boolean;
  meUserId?: string;
  members: TeamMember[];
  invitations: TeamInvitation[];
  /** Owner only; undefined hides the card. */
  managerCanEditServices?: boolean;
}) {
  const grantable: BranchRole[] = isOwner ? ALL_ROLES : ["RECEPTIONIST", "STYLIST"];
  const [inviteOpen, setInviteOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const [shownMembers, patchMembers] = useOptimistic(members, (rows, patch: MemberPatch) =>
    patch.kind === "remove"
      ? rows.filter((m) => m.id !== patch.id)
      : rows.map((m) =>
          m.id === patch.id
            ? { ...m, ...(patch.role && { role: patch.role }), ...(patch.status && { status: patch.status }) }
            : m,
        ),
  );
  const [shownInvites, dropInvite] = useOptimistic(invitations, (rows, id: string) =>
    rows.filter((i) => i.id !== id),
  );
  const [canEdit, setCanEditOptimistic] = useOptimistic(managerCanEditServices ?? false);

  const [toRemove, setToRemove] = useState<TeamMember | null>(null);

  const canHandle = (m: TeamMember) => m.userId !== meUserId && (isOwner || m.role !== "MANAGER");

  const run = (key: string, work: () => Promise<void>) => {
    setBusy(key);
    startTransition(async () => {
      try {
        await work();
      } finally {
        setBusy(null);
      }
    });
  };

  const change = (m: TeamMember, next: { role?: BranchRole; status?: "ACTIVE" | "SUSPENDED" }) =>
    run(m.id, async () => {
      patchMembers({ id: m.id, kind: "update", ...next });
      const result = await updateMember(salonId, m.id, next);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      const left = result.data?.futureBookings ?? 0;
      toast.success(
        next.status === "SUSPENDED"
          ? `${m.name} is suspended`
          : next.status === "ACTIVE"
            ? `${m.name} is active again`
            : `${m.name} is now ${ROLE_LABEL[next.role!].toLowerCase()}`,
        left > 0
          ? { description: `${plural(left, "upcoming booking")} still name them. Reassign them from Appointments.` }
          : undefined,
      );
    });

  const confirmRemove = () => {
    const m = toRemove;
    if (!m) return;
    setToRemove(null);
    run(m.id, async () => {
      patchMembers({ id: m.id, kind: "remove" });
      const result = await removeMember(salonId, m.id);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(`${m.name} was removed`);
    });
  };

  const resend = (inv: TeamInvitation) =>
    run(inv.id, async () => {
      const result = await resendInvitation(salonId, inv.id);
      if (!result.success) toast.error(result.message);
      else if (result.data?.inviteUrl) {
        toast.warning("The email didn't go out", { description: result.data.inviteUrl, duration: 15000 });
      } else toast.success(`Invitation sent again to ${inv.email}`);
    });

  const revoke = (inv: TeamInvitation) =>
    run(inv.id, async () => {
      dropInvite(inv.id);
      const result = await revokeInvitation(salonId, inv.id);
      if (!result.success) toast.error(result.message);
      else toast.success("Invitation revoked");
    });

  const toggleServices = (next: boolean) =>
    run("services", async () => {
      setCanEditOptimistic(next);
      const result = await setManagerCanEditServices(salonId, next);
      if (!result.success) toast.error(result.message);
    });

  const memberColumns: Column<TeamMember>[] = [
    {
      key: "name",
      header: "Name",
      mobile: "primary",
      cell: (m) => (
        <div className="min-w-0">
          <p className="truncate font-medium">
            {m.name}
            {m.userId === meUserId && <span className="text-muted-foreground"> (you)</span>}
          </p>
          <p className="truncate text-xs text-muted-foreground">{m.email}</p>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      mobile: "eyebrow",
      cell: (m) => (
        <ToneBadge status={m.role} tone={m.role === "MANAGER" ? "primary" : "neutral"}>
          {ROLE_LABEL[m.role]}
        </ToneBadge>
      ),
    },
    {
      key: "status",
      header: "Status",
      mobile: "trailing",
      cell: (m) => (
        <ToneBadge status={m.status} tone={m.status === "ACTIVE" ? "success" : "warning"} dot />
      ),
    },
    {
      key: "joined",
      header: "Joined",
      mobile: "meta",
      cell: (m) => <span className="text-sm text-muted-foreground">{fmt(m.joinedAt)}</span>,
    },
  ];

  const memberMenu = (m: TeamMember) =>
    canHandle(m) ? (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={`Actions for ${m.name}`}
            disabled={busy === m.id}
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel>Change role</DropdownMenuLabel>
          {grantable
            .filter((r) => r !== m.role)
            .map((r) => (
              <DropdownMenuItem key={r} onSelect={() => change(m, { role: r })}>
                Make {ROLE_LABEL[r].toLowerCase()}
              </DropdownMenuItem>
            ))}
          <DropdownMenuSeparator />
          {m.status === "ACTIVE" ? (
            <DropdownMenuItem onSelect={() => change(m, { status: "SUSPENDED" })}>
              Suspend
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => change(m, { status: "ACTIVE" })}>
              Reactivate
            </DropdownMenuItem>
          )}
          <DropdownMenuItem variant="destructive" onSelect={() => setToRemove(m)}>
            Remove from team
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ) : null;

  const inviteColumns: Column<TeamInvitation>[] = [
    {
      key: "email",
      header: "Email",
      mobile: "primary",
      cell: (i) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{i.name || i.email}</p>
          {i.name && <p className="truncate text-xs text-muted-foreground">{i.email}</p>}
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      mobile: "eyebrow",
      cell: (i) => <ToneBadge status={i.role} tone="neutral">{ROLE_LABEL[i.role]}</ToneBadge>,
    },
    {
      key: "expires",
      header: "Expires",
      mobile: "meta",
      cell: (i) =>
        i.expired ? (
          <ToneBadge status="EXPIRED" tone="warning">Expired</ToneBadge>
        ) : (
          <span className="text-sm text-muted-foreground">
            {fmt(i.expiresAt)}
            {i.inviterName && ` · by ${i.inviterName}`}
          </span>
        ),
    },
  ];

  const inviteActions = (i: TeamInvitation) => (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" disabled={busy === i.id} onClick={() => resend(i)}>
        <RotateCw />
        Resend
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="text-muted-foreground hover:text-danger"
        disabled={busy === i.id}
        onClick={() => revoke(i)}
      >
        <X />
        Revoke
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus />
          Invite
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Members · {shownMembers.length}</CardTitle>
          <CardDescription>Who works at {salonName}, and what they can do.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataList
            items={shownMembers}
            rowKey={(m) => m.id}
            columns={memberColumns}
            caption="Team members"
            rowActions={memberMenu}
            rowClassName={(m) => (busy === m.id ? "opacity-60" : "")}
            empty={
              <div className="rounded-2xl border border-dashed border-border">
                <EmptyState
                  icon={Users}
                  title="No one on the team yet"
                  description="Invite a manager, a receptionist or your stylists."
                />
              </div>
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending invitations · {shownInvites.length}</CardTitle>
          <CardDescription>
            {isOwner ? "Links that haven't been accepted yet." : "Invitations you sent that haven't been accepted yet."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataList
            items={shownInvites}
            rowKey={(i) => i.id}
            columns={inviteColumns}
            caption="Pending invitations"
            rowActions={inviteActions}
            empty={
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <MailPlus className="size-4" aria-hidden="true" />
                No invitations waiting.
              </p>
            }
          />
        </CardContent>
      </Card>

      {managerCanEditServices !== undefined && (
        <Card>
          <CardContent className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <label htmlFor="manager-can-edit" className="font-medium">
                Managers can edit services and prices
              </label>
              <p className="text-sm text-muted-foreground">
                Off: managers can only turn services on and off. Applies to {salonName}.
              </p>
            </div>
            <Switch
              id="manager-can-edit"
              checked={canEdit}
              disabled={busy === "services"}
              onCheckedChange={toggleServices}
            />
          </CardContent>
        </Card>
      )}

      <InviteMemberDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        salonId={salonId}
        salonName={salonName}
        roles={grantable}
      />

      <ConfirmDialog
        open={!!toRemove}
        onOpenChange={(open) => !open && setToRemove(null)}
        title={`Remove ${toRemove?.name ?? "this member"}?`}
        description={
          toRemove && toRemove.upcomingBookings > 0
            ? `${plural(toRemove.upcomingBookings, "upcoming booking")} name them as the stylist. They stay booked - reassign them from Appointments. ${toRemove.name} loses access to ${salonName} at once.`
            : `${toRemove?.name ?? "They"} loses access to ${salonName} at once. You can invite them again later.`
        }
        confirmLabel="Remove"
        destructive
        onConfirm={confirmRemove}
      />
    </div>
  );
}
