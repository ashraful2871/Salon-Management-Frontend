"use client";

import { useId, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Loader2, MapPin, MoreHorizontal, Plus, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AreaPicker, type AreaValue } from "@/components/Admin/AreaPicker";
import { InvitationsList } from "@/components/Admin/InvitationsList";
import { ReasonDialog } from "@/components/Admin/ReasonDialog";
import { REACTIVATE_REASONS, STATUS_REASONS, reasonText, timeAgo } from "@/components/Admin/users/labels";
import { DataList, type Column } from "@/components/Shared/DataList";
import { EmptyState } from "@/components/Shared/EmptyState";
import { ErrorState } from "@/components/Shared/ErrorState";
import { FilterBar } from "@/components/Shared/FilterBar";
import { PageHeader } from "@/components/Shared/PageHeader";
import Pagination from "@/components/Shared/Pagination";
import { PendingRegion } from "@/components/Shared/PendingRegion";
import { ResponsiveDialog } from "@/components/Shared/ResponsiveDialog";
import { ToneBadge } from "@/components/Shared/ToneBadge";
import { showResultToast } from "@/components/Shared/showResultToast";
import { FilterNavigationProvider, useFilterNavigation } from "@/hooks/useFilterNavigation";
import type { ApiResponse } from "@/lib/api-types";
import { inviteAgent } from "@/services/admin/agents/inviteAgent";
import { resendAgentInvitation } from "@/services/admin/agents/resendAgentInvitation";
import { revokeAgentInvitation } from "@/services/admin/agents/revokeAgentInvitation";
import { updateAgentArea } from "@/services/admin/agents/updateAgentArea";
import { updateAgentStatus } from "@/services/admin/agents/updateAgentStatus";
import type { AdminAgent, AdminAgentsData, AreaOption } from "@/services/admin/agents/types";
import type { AdminListMeta } from "@/services/admin/users/types";

type Props = {
  response: ApiResponse<AdminAgentsData>;
  areas: AreaOption[];
  filters: { q?: string; page: number };
};

export function AgentsClient(props: Props) {
  return (
    <FilterNavigationProvider>
      <AgentsList {...props} />
    </FilterNavigationProvider>
  );
}

function AgentsList({ response, areas, filters }: Props) {
  const pathname = usePathname();
  const { navigate, isPending } = useFilterNavigation();
  const [q, setQ] = useState(filters.q ?? "");
  const [inviting, setInviting] = useState(false);
  const [editing, setEditing] = useState<AdminAgent | null>(null);
  const [statusOf, setStatusOf] = useState<AdminAgent | null>(null);

  const agents = response.success ? (response.data?.agents ?? []) : [];
  const invitations = response.success ? (response.data?.invitations ?? []) : [];
  const meta = response.meta as unknown as AdminListMeta | undefined;

  const go = (next: { q?: string; page?: number }) => {
    const merged = { ...filters, page: 1, ...next };
    const params = new URLSearchParams();
    if (merged.q) params.set("q", merged.q);
    if (merged.page > 1) params.set("page", String(merged.page));
    const query = params.toString();
    navigate(query ? `${pathname}?${query}` : pathname);
  };

  const columns: Column<AdminAgent>[] = [
    {
      key: "agent",
      header: "Agent",
      mobile: "primary",
      cell: (a) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{a.name}</p>
          <p className="truncate text-xs text-muted-foreground">{a.email}</p>
        </div>
      ),
    },
    {
      key: "area",
      header: "Area",
      mobile: "secondary",
      cell: (a) => (
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
          {a.area}, {a.district}
        </span>
      ),
    },
    { key: "status", header: "Status", mobile: "trailing", cell: (a) => <ToneBadge status={a.status} /> },
    {
      key: "mfa",
      header: "Two-factor",
      cell: (a) => (
        <ToneBadge status={a.mfaEnabled ? "ON" : "OFF"} tone={a.mfaEnabled ? "success" : "warning"}>
          {a.mfaEnabled ? "On" : "Not set up"}
        </ToneBadge>
      ),
    },
    { key: "lastActiveAt", header: "Last active", cell: (a) => timeAgo(a.lastActiveAt) },
  ];

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Agents"
        description="Area agents review salons in their own area only. They join by invitation."
        actions={
          <Button onClick={() => setInviting(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Invite agent
          </Button>
        }
      />

      <FilterBar
        pending={isPending}
        search={{
          value: q,
          onChange: setQ,
          onSubmit: (value) => go({ q: value.trim() || undefined }),
          placeholder: "Name, email or area",
          label: "Search agents",
        }}
      />

      {!response.success ? (
        <ErrorState title="Couldn't load agents" message={response.message} />
      ) : (
        <PendingRegion>
          <DataList
            items={agents}
            rowKey={(a) => a.id}
            columns={columns}
            density="compact"
            caption="Agents"
            rowActions={(a) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label={`Actions for ${a.name}`}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/admin/users/${a.id}`}>Open profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setEditing(a)}>Edit area…</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setStatusOf(a)}>
                    {a.status === "ACTIVE" ? "Suspend…" : "Reactivate…"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            empty={
              <EmptyState
                icon={UserCog}
                title={filters.q ? "No agents match" : "No agents yet"}
                description={filters.q ? undefined : "Invite one to review salons in an area."}
              />
            }
          />
        </PendingRegion>
      )}

      {meta && meta.totalPages > 1 && (
        <Pagination
          page={meta.page}
          totalPages={meta.totalPages}
          total={meta.total}
          pageSize={meta.limit}
          itemLabel="agents"
          disabled={isPending}
          onPageChange={(page) => go({ ...filters, page })}
        />
      )}

      <InvitationsList
        invitations={invitations}
        describe={(inv) => (inv.area ? `${inv.area}, ${inv.district}` : "Agent")}
        onResend={resendAgentInvitation}
        onRevoke={revokeAgentInvitation}
      />

      <InviteAgentDialog open={inviting} onOpenChange={setInviting} areas={areas} />
      <EditAreaDialog agent={editing} onClose={() => setEditing(null)} areas={areas} />

      <ReasonDialog
        open={!!statusOf}
        onOpenChange={(open) => !open && setStatusOf(null)}
        title={statusOf?.status === "ACTIVE" ? `Suspend ${statusOf?.name}` : `Reactivate ${statusOf?.name ?? ""}`}
        description={
          statusOf?.status === "ACTIVE"
            ? "They are signed out and can't review salons until reactivated. They get an email."
            : "They can sign in and review salons in their area again."
        }
        reasonCodes={statusOf?.status === "ACTIVE" ? STATUS_REASONS : REACTIVATE_REASONS}
        showNotify={false}
        tone={statusOf?.status === "ACTIVE" ? "danger" : "default"}
        confirmLabel={statusOf?.status === "ACTIVE" ? "Suspend" : "Reactivate"}
        onConfirm={(input) =>
          updateAgentStatus(statusOf!.id, {
            status: statusOf!.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE",
            reason: reasonText(statusOf!.status === "ACTIVE" ? STATUS_REASONS : REACTIVATE_REASONS, input),
          })
        }
        onDone={(result) => showResultToast(result)}
      />
    </div>
  );
}

function InviteAgentDialog({
  open,
  onOpenChange,
  areas,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  areas: AreaOption[];
}) {
  const ids = useId();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [area, setArea] = useState<AreaValue | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const reset = () => {
    setEmail("");
    setName("");
    setArea(null);
    setError(null);
    setLink(null);
  };

  const submit = () =>
    startTransition(async () => {
      if (!area) return setError("Pick the area they will review.");
      setError(null);
      const result = await inviteAgent({ email: email.trim(), name: name.trim() || undefined, ...area });
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
      title="Invite an agent"
      description="They get an email link. After accepting and setting up two-factor sign-in they see salons in this area only."
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
            <Label htmlFor={`${ids}-area`}>Area</Label>
            <AreaPicker id={`${ids}-area`} areas={areas} value={area} onChange={setArea} />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
        </div>
      )}
    </ResponsiveDialog>
  );
}

function EditAreaDialog({
  agent,
  onClose,
  areas,
}: {
  agent: AdminAgent | null;
  onClose: () => void;
  areas: AreaOption[];
}) {
  const [area, setArea] = useState<AreaValue | null>(null);
  const current = agent ? { division: agent.division, district: agent.district, area: agent.area } : null;
  const value = area ?? current;

  return (
    <ReasonDialog
      open={!!agent}
      onOpenChange={(open) => {
        if (!open) {
          setArea(null);
          onClose();
        }
      }}
      title={`Change ${agent?.name ?? "the agent"}'s area`}
      description="Takes effect on their next request: they only see salons in the new area."
      impact={<AreaPicker areas={areas} value={value} onChange={setArea} />}
      reasonCodes={[
        { value: "Reassigned", label: "Reassigned to another area" },
        { value: "Correcting a mistake", label: "Correcting a mistake" },
        { value: "OTHER", label: "Other" },
      ]}
      showNotify={false}
      confirmLabel="Save area"
      onConfirm={async (input) => {
        if (!agent || !value) return { success: false, message: "Pick an area." };
        const reason = input.reasonCode === "OTHER" ? input.note : input.note ? `${input.reasonCode}: ${input.note}` : input.reasonCode;
        return updateAgentArea(agent.id, { ...value, reason });
      }}
      onDone={(result) => {
        setArea(null);
        showResultToast(result);
      }}
    />
  );
}
