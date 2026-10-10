"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Eye, ShieldAlert, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { EntityHeader, EntityTabs } from "@/components/Admin/EntityHeader";
import { CopyId } from "@/components/Admin/MaskedValue";
import { NotesPanel } from "@/components/Admin/NotesPanel";
import { ReasonDialog } from "@/components/Admin/ReasonDialog";
import { useStepUp } from "@/components/Admin/StepUpDialog";
import { Timeline } from "@/components/Admin/Timeline";
import { StatusDialog, type StatusAction } from "@/components/Admin/users/StatusDialog";
import {
  ACCESS_REASONS,
  PRIVACY_REASONS,
  ROLE_LABELS,
  VIEW_AS_REASONS,
  formatDay,
  reasonText,
  timeAgo,
} from "@/components/Admin/users/labels";
import { DataList, type Column } from "@/components/Shared/DataList";
import { EmptyState } from "@/components/Shared/EmptyState";
import { ToneBadge, humanizeStatus } from "@/components/Shared/ToneBadge";
import { showResultToast } from "@/components/Shared/showResultToast";
import { can } from "@/lib/admin-permissions";
import type { ApiResponse } from "@/lib/api-types";
import { formatBDT } from "@/lib/money";
import { startImpersonation } from "@/services/admin/impersonation/startImpersonation";
import { anonymizeUser } from "@/services/admin/users/anonymizeUser";
import { revokeUserSessions } from "@/services/admin/users/revokeUserSessions";
import { updateUserRole, type ChangeableRole } from "@/services/admin/users/updateUserRole";
import { verifyUserEmail } from "@/services/admin/users/verifyUserEmail";
import type {
  AdminActivityRow,
  AdminUserBooking,
  AdminUserDetail,
  AdminUserReview,
  AdminUserWallet,
  AdminWalletTransaction,
} from "@/services/admin/users/types";

type Dialog =
  | { kind: "status"; action: StatusAction }
  | { kind: "signout" | "verify" | "role" | "viewas" | "anonymize" }
  | null;

/** "View as" never opens an admin or agent account (the API refuses too). */
const VIEWABLE = ["CUSTOMER", "STAFF", "SALON_OWNER"];

const CHANGEABLE: ChangeableRole[] = ["CUSTOMER", "SALON_OWNER", "STAFF"];

const Fact = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex items-start justify-between gap-4 py-1.5 text-sm">
    <dt className="shrink-0 text-muted-foreground">{label}</dt>
    <dd className="min-w-0 text-right break-words">{children}</dd>
  </div>
);

const Panel = ({ title, children }: { title: string; children: ReactNode }) => (
  <Card className="min-w-0">
    <CardHeader className="pb-2">
      <CardTitle className="text-base">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <dl className="divide-y divide-border">{children}</dl>
    </CardContent>
  </Card>
);

const listOrEmpty = <T,>(response: ApiResponse<T[]>) =>
  response.success && Array.isArray(response.data) ? response.data : [];

export function UserDetailClient({
  user,
  bookings,
  reviews,
  activity,
  wallet,
  permissions,
  viewerId,
}: {
  user: AdminUserDetail;
  bookings: ApiResponse<AdminUserBooking[]>;
  reviews: ApiResponse<AdminUserReview[]>;
  activity: ApiResponse<AdminActivityRow[]>;
  wallet: ApiResponse<AdminUserWallet> | null;
  permissions: string[];
  viewerId?: string;
}) {
  const [dialog, setDialog] = useState<Dialog>(null);
  const [newRole, setNewRole] = useState<ChangeableRole>("CUSTOMER");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [exporting, setExporting] = useState(false);
  const router = useRouter();
  const { run: withStepUp, dialog: stepUpDialog } = useStepUp();

  // Admin accounts are managed on the team page; nobody acts on themselves.
  const actionable = user.role !== "ADMIN" && user.id !== viewerId;
  const canManage = actionable && can(permissions, "users.manage");
  const canRole = actionable && can(permissions, "users.role") && user.role !== "AGENT";
  const canViewAs =
    user.id !== viewerId &&
    can(permissions, "users.impersonate") &&
    VIEWABLE.includes(user.role) &&
    user.status === "ACTIVE";
  const canPrivacy = actionable && can(permissions, "users.delete") && user.role !== "AGENT";

  // A download through the export route; a closed step-up window answers
  // STEP_UP_REQUIRED (X-Error-Code), and useStepUp asks for a code and retries.
  const exportData = async () => {
    setExporting(true);
    const result = await withStepUp<never>(async () => {
      const response = await fetch(`/api/admin/export/users/${user.id}.json`, { cache: "no-store" });
      if (!response.ok) {
        return {
          success: false,
          message: (await response.text()) || "The export failed. Please try again.",
          errorCode: response.headers.get("x-error-code") ?? undefined,
        };
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = `user-${user.id}.json`;
      link.click();
      URL.revokeObjectURL(url);
      return { success: true, message: "Data export downloaded" };
    });
    setExporting(false);
    showResultToast(result);
  };

  const close = (open: boolean) => {
    if (!open) setDialog(null);
  };

  const actions = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={!canManage && !canRole && !canViewAs}>
          Actions
          <ChevronDown className="ml-1.5 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {canViewAs && (
          <>
            <DropdownMenuItem onSelect={() => setDialog({ kind: "viewas" })}>
              <Eye className="mr-2 h-4 w-4" />
              View as…
            </DropdownMenuItem>
            {(canManage || canRole) && <DropdownMenuSeparator />}
          </>
        )}
        {canManage && user.status === "ACTIVE" && (
          <DropdownMenuItem onSelect={() => setDialog({ kind: "status", action: "SUSPENDED" })}>
            Suspend…
          </DropdownMenuItem>
        )}
        {canManage && user.status !== "BLOCKED" && (
          <DropdownMenuItem
            className="text-danger"
            onSelect={() => setDialog({ kind: "status", action: "BLOCKED" })}
          >
            Block…
          </DropdownMenuItem>
        )}
        {canManage && user.status !== "ACTIVE" && (
          <DropdownMenuItem onSelect={() => setDialog({ kind: "status", action: "ACTIVE" })}>
            Reactivate…
          </DropdownMenuItem>
        )}
        {canManage && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setDialog({ kind: "signout" })}>
              Sign out everywhere…
            </DropdownMenuItem>
            {!user.emailVerified && (
              <DropdownMenuItem onSelect={() => setDialog({ kind: "verify" })}>
                Mark email verified…
              </DropdownMenuItem>
            )}
          </>
        )}
        {canRole && (
          <DropdownMenuItem
            onSelect={() => {
              setNewRole(CHANGEABLE.find((r) => r !== user.role) ?? "CUSTOMER");
              setDialog({ kind: "role" });
            }}
          >
            Change account type…
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const privacy = canPrivacy && (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={exporting}>
          <ShieldAlert className="mr-1.5 h-4 w-4" />
          Privacy
          <ChevronDown className="ml-1.5 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onSelect={() => void exportData()}>Export data (JSON)</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-danger"
          onSelect={() => {
            setConfirmEmail("");
            setDialog({ kind: "anonymize" });
          }}
        >
          Anonymize account…
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const facts: ReactNode[] = [
    ROLE_LABELS[user.role] + (user.adminRole ? ` · ${humanizeStatus(user.adminRole)}` : ""),
    `Joined ${formatDay(user.createdAt)}`,
    `Last active ${timeAgo(user.lastActiveAt).toLowerCase()}`,
    <CopyId key="id" id={user.id} />,
  ];
  if (user.isTest) facts.push("Test data");

  const overview = (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Contact">
        <Fact label="Email">
          {user.email}{" "}
          <ToneBadge status={user.emailVerified ? "VERIFIED" : "UNVERIFIED"} tone={user.emailVerified ? "success" : "warning"}>
            {user.emailVerified ? "Verified" : "Not verified"}
          </ToneBadge>
        </Fact>
        <Fact label="Phone">{user.phone ?? "—"}</Fact>
        {!user.piiMasked && <Fact label="Address">{user.address ?? "—"}</Fact>}
        {!user.piiMasked && <Fact label="Date of birth">{formatDay(user.dateOfBirth)}</Fact>}
        <Fact label="Gender">{user.gender ? humanizeStatus(user.gender) : "—"}</Fact>
        {user.piiMasked && (
          <p className="pt-2 text-xs text-muted-foreground">Contact details are masked for your role.</p>
        )}
      </Panel>

      <Panel title="Account">
        <Fact label="Status">
          <ToneBadge status={user.status} />
        </Fact>
        {user.statusReason && <Fact label="Reason">{user.statusReason}</Fact>}
        {user.statusChangedAt && <Fact label="Changed">{formatDay(user.statusChangedAt)}</Fact>}
        {user.suspendedUntil && <Fact label="Suspended until">{formatDay(user.suspendedUntil)}</Fact>}
        <Fact label="Sign-in">
          {[
            user.signInMethods.password && "Password",
            ...user.signInMethods.identities.map((i) => humanizeStatus(i.provider)),
          ]
            .filter(Boolean)
            .join(", ") || "Email code only"}
        </Fact>
        {user.mfa && (
          <Fact label="Two-factor">
            <ToneBadge status={user.mfa.enabled ? "ON" : "OFF"} tone={user.mfa.enabled ? "success" : "danger"}>
              {user.mfa.enabled ? "On" : "Not set up"}
            </ToneBadge>
          </Fact>
        )}
        {user.role === "ADMIN" && (
          <p className="pt-2 text-xs text-muted-foreground">
            Admin accounts are managed on the{" "}
            <Link href="/dashboard/admin/team" className="text-primary hover:underline">
              team page
            </Link>
            .
          </p>
        )}
      </Panel>

      <Panel title="Activity">
        <Fact label="Bookings">{user.counts.bookings}</Fact>
        <Fact label="Upcoming">{user.counts.upcoming}</Fact>
        <Fact label="Completed">{user.counts.completed}</Fact>
        <Fact label="Cancelled">{user.counts.cancelled}</Fact>
        <Fact label="No-shows">{user.counts.noShow}</Fact>
        <Fact label="Reviews">{user.counts.reviews}</Fact>
      </Panel>

      <Panel title="Wallet">
        {user.wallet ? (
          <>
            <Fact label="Balance">{formatBDT(user.wallet.balanceMinor)}</Fact>
            <Fact label="Held for deposits">{formatBDT(user.wallet.heldMinor)}</Fact>
            <Fact label="Frozen">{user.wallet.isFrozen ? "Yes" : "No"}</Fact>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No wallet yet.</p>
        )}
      </Panel>

      {(user.ownedSalons.length > 0 || user.worksAt || user.agentArea || user.ownerApplication) && (
        <Panel title={user.role === "AGENT" ? "Area" : "Salons"}>
          {user.agentArea && (
            <Fact label="Reviews salons in">
              {user.agentArea.area}, {user.agentArea.district}, {user.agentArea.division}
            </Fact>
          )}
          {user.ownerApplication && (
            <Fact label="Owner application">
              <ToneBadge status={user.ownerApplication} />
            </Fact>
          )}
          {user.ownedSalons.map((s) => (
            <Fact key={s.id} label={`${s.area}, ${s.district}`}>
              {s.name} <ToneBadge status={s.status} />
            </Fact>
          ))}
          {user.worksAt && (
            <Fact label="Works at">
              {user.worksAt.name} <ToneBadge status={user.worksAt.status} />
            </Fact>
          )}
        </Panel>
      )}
    </div>
  );

  const bookingRows = listOrEmpty(bookings);
  const bookingColumns: Column<AdminUserBooking>[] = [
    {
      key: "when",
      header: "When",
      mobile: "primary",
      cell: (b) => `${formatDay(b.appointmentDate)} · ${b.startTime}`,
    },
    { key: "salon", header: "Salon", mobile: "secondary", cell: (b) => b.salon.name },
    { key: "service", header: "Service", cell: (b) => b.service.name },
    { key: "status", header: "Status", mobile: "trailing", cell: (b) => <ToneBadge status={b.status} /> },
    { key: "total", header: "Total", align: "right", cell: (b) => formatBDT(b.totalMinor) },
    {
      key: "deposit",
      header: "Deposit",
      align: "right",
      cell: (b) => (b.depositMinor ? `${formatBDT(b.depositMinor)} · ${humanizeStatus(b.depositStatus)}` : "—"),
    },
  ];

  const txColumns: Column<AdminWalletTransaction>[] = [
    { key: "date", header: "Date", mobile: "eyebrow", cell: (t) => formatDay(t.createdAt) },
    { key: "description", header: "Description", mobile: "primary", cell: (t) => t.description },
    { key: "type", header: "Type", cell: (t) => humanizeStatus(t.type) },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      mobile: "trailing",
      cell: (t) => (
        <span className={t.amountMinor < 0 ? "text-danger" : t.amountMinor > 0 ? "text-success" : undefined}>
          {formatBDT(t.amountMinor)}
        </span>
      ),
    },
    { key: "balance", header: "Balance after", align: "right", cell: (t) => formatBDT(t.balanceAfterMinor) },
  ];

  const walletTab = !wallet ? (
    <EmptyState title="Wallet history needs finance access" />
  ) : !wallet.success || !wallet.data ? (
    <EmptyState title="Couldn't load the wallet" description={wallet.message} />
  ) : (
    <div className="space-y-4">
      {wallet.data.wallet && (
        <p className="text-sm text-muted-foreground">
          Balance <span className="font-medium text-foreground">{formatBDT(wallet.data.wallet.balanceMinor)}</span>,
          of which {formatBDT(wallet.data.wallet.heldMinor)} held for deposits
          {wallet.data.wallet.isFrozen ? " · frozen" : ""}.
        </p>
      )}
      <DataList
        items={wallet.data.transactions}
        rowKey={(t) => t.id}
        columns={txColumns}
        density="compact"
        caption="Wallet transactions"
        empty={<EmptyState title="No wallet transactions" />}
      />
    </div>
  );

  const reviewRows = listOrEmpty(reviews);
  const reviewColumns: Column<AdminUserReview>[] = [
    { key: "date", header: "Date", mobile: "eyebrow", cell: (r) => formatDay(r.createdAt) },
    { key: "salon", header: "Salon", mobile: "primary", cell: (r) => r.salon.name },
    {
      key: "rating",
      header: "Rating",
      mobile: "trailing",
      cell: (r) => (
        <span className="inline-flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-current text-warning" aria-hidden />
          {r.rating}
        </span>
      ),
    },
    { key: "comment", header: "Comment", mobile: "secondary", cell: (r) => r.comment || "—" },
  ];

  const activityRows = listOrEmpty(activity);
  const timeline = activityRows.map((a) => ({
    at: a.createdAt,
    title: `${humanizeStatus(a.action.replace(/\./g, "_"))}${a.entityId === user.id ? "" : ` (${a.entityType})`}`,
    detail: a.reason ?? undefined,
    tone: a.action.includes("suspend") || a.action.includes("block") ? ("danger" as const) : undefined,
    meta: `${a.actorName ?? humanizeStatus(a.actorRole)}${a.source !== "api" ? ` · ${a.source}` : ""}`,
  }));

  const tabs = [
    { key: "overview", label: "Overview", content: overview },
    {
      key: "bookings",
      label: "Bookings",
      count: user.counts.bookings,
      content: (
        <DataList
          items={bookingRows}
          rowKey={(b) => b.id}
          columns={bookingColumns}
          density="compact"
          caption="Bookings"
          empty={<EmptyState title="No bookings yet" />}
        />
      ),
    },
    { key: "wallet", label: "Wallet", content: walletTab },
    {
      key: "reviews",
      label: "Reviews",
      count: user.counts.reviews,
      content: (
        <DataList
          items={reviewRows}
          rowKey={(r) => r.id}
          columns={reviewColumns}
          density="compact"
          caption="Reviews"
          empty={<EmptyState title="No reviews written" />}
        />
      ),
    },
    {
      key: "activity",
      label: "Activity",
      content: timeline.length ? <Timeline items={timeline} /> : <EmptyState title="Nothing on the audit log yet" />,
    },
    {
      key: "notes",
      label: "Notes",
      content: <NotesPanel entityType="user" entityId={user.id} currentUserId={viewerId} />,
    },
  ];

  return (
    <div className="min-w-0 space-y-6">
      <EntityHeader
        title={user.name}
        imageUrl={user.profilePhoto}
        status={user.status}
        facts={facts}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {privacy}
            {actions}
          </div>
        }
      />
      <EntityTabs tabs={tabs} />

      {dialog?.kind === "status" && (
        <StatusDialog
          open
          onOpenChange={close}
          action={dialog.action}
          users={[{ id: user.id, name: user.name }]}
        />
      )}

      {stepUpDialog}

      <ReasonDialog
        open={dialog?.kind === "viewas"}
        onOpenChange={close}
        title={`View as ${user.name}`}
        description="You see their dashboard and the site as they do, read-only, for 15 minutes. Every page you open is recorded."
        reasonCodes={VIEW_AS_REASONS}
        showNotify={false}
        stepUp
        confirmLabel="Start viewing"
        onConfirm={(input) => startImpersonation(user.id, reasonText(VIEW_AS_REASONS, input))}
        onDone={(result) => showResultToast(result)}
      />

      <ReasonDialog
        open={dialog?.kind === "anonymize"}
        onOpenChange={close}
        tone="danger"
        title={`Anonymize ${user.name}`}
        description="Their name, email, phone, address, birthday and photo are erased, sign-in methods and chats are deleted, and review text is removed. Bookings, wallet and payment records stay. This cannot be undone."
        impact={
          <div className="space-y-1.5">
            <Label htmlFor="confirm-email">Type {user.email} to confirm</Label>
            <Input
              id="confirm-email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        }
        reasonCodes={PRIVACY_REASONS}
        showNotify={false}
        stepUp
        confirmLabel="Anonymize"
        onConfirm={async (input) =>
          confirmEmail.trim().toLowerCase() === user.email.toLowerCase()
            ? anonymizeUser(user.id, reasonText(PRIVACY_REASONS, input), confirmEmail)
            : { success: false, message: "Type the account's email exactly to confirm." }
        }
        onDone={(result) => {
          showResultToast(result);
          // The account no longer opens in the 360 once it is anonymized.
          if (result.success) router.push("/dashboard/admin/users");
        }}
      />

      <ReasonDialog
        open={dialog?.kind === "signout"}
        onOpenChange={close}
        title={`Sign ${user.name} out everywhere`}
        description="Every device signs out at once; they can sign straight back in."
        reasonCodes={ACCESS_REASONS}
        showNotify={false}
        confirmLabel="Sign out everywhere"
        onConfirm={(input) => revokeUserSessions(user.id, reasonText(ACCESS_REASONS, input))}
        onDone={(result) => showResultToast(result)}
      />

      <ReasonDialog
        open={dialog?.kind === "verify"}
        onOpenChange={close}
        title="Mark email verified"
        description={`Only when you have confirmed ${user.name} owns this address another way.`}
        reasonCodes={ACCESS_REASONS}
        showNotify={false}
        stepUp
        confirmLabel="Mark verified"
        onConfirm={(input) => verifyUserEmail(user.id, reasonText(ACCESS_REASONS, input))}
        onDone={(result) => showResultToast(result)}
      />

      <ReasonDialog
        open={dialog?.kind === "role"}
        onOpenChange={close}
        title="Change account type"
        description={`${user.name} is a ${ROLE_LABELS[user.role].toLowerCase()} now. They sign in again to see the change.`}
        impact={
          <div className="space-y-1.5">
            <Label htmlFor="new-role">New type</Label>
            <Select value={newRole} onValueChange={(v) => setNewRole(v as ChangeableRole)}>
              <SelectTrigger id="new-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHANGEABLE.filter((r) => r !== user.role).map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
        reasonCodes={ACCESS_REASONS}
        showNotify={false}
        stepUp
        confirmLabel="Change type"
        onConfirm={(input) => updateUserRole(user.id, newRole, reasonText(ACCESS_REASONS, input))}
        onDone={(result) => showResultToast(result)}
      />
    </div>
  );
}
