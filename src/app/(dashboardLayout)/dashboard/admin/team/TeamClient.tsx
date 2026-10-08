"use client";

import { useId, useState, useTransition } from "react";
import Link from "next/link";
import { Loader2, MoreHorizontal, Plus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InvitationsList } from "@/components/Admin/InvitationsList";
import { ReasonDialog, type ReasonCode } from "@/components/Admin/ReasonDialog";
import { useStepUp } from "@/components/Admin/StepUpDialog";
import { reasonText, timeAgo } from "@/components/Admin/users/labels";
import { DataList, type Column } from "@/components/Shared/DataList";
import { EmptyState } from "@/components/Shared/EmptyState";
import { ErrorState } from "@/components/Shared/ErrorState";
import { PageHeader } from "@/components/Shared/PageHeader";
import { ResponsiveDialog } from "@/components/Shared/ResponsiveDialog";
import { ToneBadge, humanizeStatus } from "@/components/Shared/ToneBadge";
import { showResultToast } from "@/components/Shared/showResultToast";
import type { ApiResponse } from "@/lib/api-types";
import { changeAdminRole } from "@/services/admin/team/changeAdminRole";
import { inviteAdmin } from "@/services/admin/team/inviteAdmin";
import { removeAdmin } from "@/services/admin/team/removeAdmin";
import { resendAdminInvitation } from "@/services/admin/team/resendAdminInvitation";
import { resetAdminMfa } from "@/services/admin/team/resetAdminMfa";
import { revokeAdminInvitation } from "@/services/admin/team/revokeAdminInvitation";
import { ADMIN_ROLES, type AdminRoleName, type AdminTeam, type TeamMember } from "@/services/admin/team/types";

const ROLE_HINTS: Record<AdminRoleName, string> = {
  SUPER_ADMIN: "Everything, including the team",
  OPERATIONS: "Users, salons, bookings, settings",
  FINANCE: "Payouts, refunds, wallets",
  SUPPORT: "Users, bookings, support inbox",
  MODERATOR: "Reviews and user conduct",
  ANALYST: "Read-only reports",
};

const TEAM_REASONS: ReasonCode[] = [
  { value: "Change of responsibilities", label: "Change of responsibilities" },
  { value: "Left the company", label: "Left the company" },
  { value: "Lost their phone", label: "Lost their phone or authenticator" },
  { value: "Security concern", label: "Security concern" },
  { value: "OTHER", label: "Other" },
];

type Action = { kind: "role" | "remove" | "mfa"; member: TeamMember } | null;

const RoleSelect = ({
  id,
  value,
  onChange,
}: {
  id?: string;
  value: AdminRoleName;
  onChange: (role: AdminRoleName) => void;
}) => (
  <Select value={value} onValueChange={(v) => onChange(v as AdminRoleName)}>
    <SelectTrigger id={id} className="w-full">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {ADMIN_ROLES.map((role) => (
        <SelectItem key={role} value={role}>
          {humanizeStatus(role)}
          <span className="ml-1 text-xs text-muted-foreground">· {ROLE_HINTS[role]}</span>
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

/** Admins and pending admin invitations. Every write is tier 3 (step-up). */
export function TeamClient({ response, viewerId }: { response: ApiResponse<AdminTeam>; viewerId?: string }) {
  const [action, setAction] = useState<Action>(null);
  const [role, setRole] = useState<AdminRoleName>("ANALYST");
  const [inviting, setInviting] = useState(false);
  const { run, dialog } = useStepUp();

  const members = response.success ? (response.data?.members ?? []) : [];
  const invitations = response.success ? (response.data?.invitations ?? []) : [];

  const columns: Column<TeamMember>[] = [
    {
      key: "member",
      header: "Member",
      mobile: "primary",
      cell: (m) => (
        <div className="min-w-0">
          <p className="truncate font-medium">
            {m.name}
            {m.id === viewerId && <span className="ml-2 text-xs font-normal text-muted-foreground">you</span>}
          </p>
          <p className="truncate text-xs text-muted-foreground">{m.email}</p>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      mobile: "eyebrow",
      cell: (m) => (m.adminRole ? humanizeStatus(m.adminRole) : "No profile"),
    },
    {
      key: "mfa",
      header: "Two-factor",
      cell: (m) => (
        <ToneBadge status={m.mfaEnabled ? "ON" : "OFF"} tone={m.mfaEnabled ? "success" : "warning"}>
          {m.mfaEnabled ? "On" : "Not set up"}
        </ToneBadge>
      ),
    },
    { key: "status", header: "Status", mobile: "trailing", cell: (m) => <ToneBadge status={m.status} /> },
    { key: "lastActiveAt", header: "Last active", cell: (m) => timeAgo(m.lastActiveAt) },
  ];

  const close = (open: boolean) => {
    if (!open) setAction(null);
  };

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Team"
        description="Admins and what they can do. Changes need a fresh authenticator code and email every super admin."
        actions={
          <Button onClick={() => setInviting(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Invite admin
          </Button>
        }
      />

      {!response.success ? (
        <ErrorState title="Couldn't load the team" message={response.message} />
      ) : (
        <DataList
          items={members}
          rowKey={(m) => m.id}
          columns={columns}
          density="compact"
          caption="Admin team"
          rowActions={(m) =>
            m.id === viewerId ? null : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label={`Actions for ${m.name}`}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/admin/users/${m.id}`}>Open profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => {
                      setRole(m.adminRole ?? "ANALYST");
                      setAction({ kind: "role", member: m });
                    }}
                  >
                    Change role…
                  </DropdownMenuItem>
                  {m.mfaEnabled && (
                    <DropdownMenuItem onSelect={() => setAction({ kind: "mfa", member: m })}>
                      Reset two-factor…
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-danger" onSelect={() => setAction({ kind: "remove", member: m })}>
                    Remove from team…
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )
          }
          empty={<EmptyState icon={ShieldCheck} title="No admins yet" />}
        />
      )}

      <InvitationsList
        invitations={invitations}
        describe={(inv) => humanizeStatus(inv.adminRole ?? "ANALYST")}
        onResend={resendAdminInvitation}
        onRevoke={revokeAdminInvitation}
        run={run}
      />

      <ReasonDialog
        open={action?.kind === "role"}
        onOpenChange={close}
        title={`Change ${action?.member.name ?? ""}'s role`}
        description="Their permissions change on their next request."
        impact={
          <div className="space-y-1.5">
            <Label htmlFor="team-role">New role</Label>
            <RoleSelect id="team-role" value={role} onChange={setRole} />
          </div>
        }
        reasonCodes={TEAM_REASONS}
        showNotify={false}
        stepUp
        confirmLabel="Change role"
        onConfirm={async (input) =>
          role === action?.member.adminRole
            ? { success: false, message: "Pick a different role." }
            : changeAdminRole(action!.member.id, role, reasonText(TEAM_REASONS, input))
        }
        onDone={(result) => showResultToast(result)}
      />

      <ReasonDialog
        open={action?.kind === "remove"}
        onOpenChange={close}
        title={`Remove ${action?.member.name ?? ""} from the team`}
        description="Their account becomes a customer account and every session ends. The last super admin can't be removed."
        reasonCodes={TEAM_REASONS}
        showNotify={false}
        stepUp
        tone="danger"
        confirmLabel="Remove"
        onConfirm={(input) => removeAdmin(action!.member.id, reasonText(TEAM_REASONS, input))}
        onDone={(result) => showResultToast(result)}
      />

      <ReasonDialog
        open={action?.kind === "mfa"}
        onOpenChange={close}
        title={`Reset two-factor for ${action?.member.name ?? ""}`}
        description="They are signed out and set up an authenticator app again at their next sign-in. Confirm who they are first."
        reasonCodes={TEAM_REASONS}
        showNotify={false}
        stepUp
        tone="danger"
        confirmLabel="Reset two-factor"
        onConfirm={(input) => resetAdminMfa(action!.member.id, reasonText(TEAM_REASONS, input))}
        onDone={(result) => showResultToast(result)}
      />

      <InviteAdminDialog open={inviting} onOpenChange={setInviting} run={run} />
      {dialog}
    </div>
  );
}

function InviteAdminDialog({
  open,
  onOpenChange,
  run,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  run: ReturnType<typeof useStepUp>["run"];
}) {
  const ids = useId();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<AdminRoleName>("ANALYST");
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const reset = () => {
    setEmail("");
    setName("");
    setRole("ANALYST");
    setError(null);
    setLink(null);
  };

  const submit = () =>
    startTransition(async () => {
      setError(null);
      const result = await run(() =>
        inviteAdmin({ email: email.trim(), name: name.trim() || undefined, adminRole: role }),
      );
      if (!result.success) return setError(result.message);
      showResultToast(result);
      if (result.data?.inviteUrl) return setLink(result.data.inviteUrl);
      reset();
      onOpenChange(false);
    });

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        if (!next) reset();
        onOpenChange(next);
      }}
      title="Invite an admin"
      description="They get an email link, accept it signed in with that address, then set up two-factor sign-in."
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            {link ? "Done" : "Cancel"}
          </Button>
          {!link && (
            <Button onClick={submit} disabled={pending || !email.trim()}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send invitation
            </Button>
          )}
        </>
      }
    >
      {link ? (
        <p className="rounded-lg bg-warning-soft p-3 text-sm break-all">
          The email didn&apos;t go out. Send this link yourself: <span className="font-mono">{link}</span>
        </p>
      ) : (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor={`${ids}-email`}>Email</Label>
            <Input
              id={`${ids}-email`}
              type="email"
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${ids}-name`}>Name (optional)</Label>
            <Input id={`${ids}-name`} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${ids}-role`}>Role</Label>
            <RoleSelect id={`${ids}-role`} value={role} onChange={setRole} />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
        </div>
      )}
    </ResponsiveDialog>
  );
}
