"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Download, UserX, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BulkActionBar } from "@/components/Admin/BulkActionBar";
import {
  BULK_LIMIT,
  StatusDialog,
} from "@/components/Admin/users/StatusDialog";
import {
  ROLE_LABELS,
  formatDay,
  timeAgo,
} from "@/components/Admin/users/labels";
import { DataList, type Column } from "@/components/Shared/DataList";
import { EmptyState } from "@/components/Shared/EmptyState";
import { ErrorState } from "@/components/Shared/ErrorState";
import { FilterBar, type FilterChip } from "@/components/Shared/FilterBar";
import { PageHeader } from "@/components/Shared/PageHeader";
import Pagination from "@/components/Shared/Pagination";
import { PendingRegion } from "@/components/Shared/PendingRegion";
import { ToneBadge } from "@/components/Shared/ToneBadge";
import {
  FilterNavigationProvider,
  useFilterNavigation,
} from "@/hooks/useFilterNavigation";
import { can } from "@/lib/admin-permissions";
import type { ApiResponse } from "@/lib/api-types";
import { formatBDT } from "@/lib/money";
import type {
  AccountRole,
  AdminListMeta,
  AdminUserFilters,
  AdminUserRow,
} from "@/services/admin/users/types";

const ROLES: AccountRole[] = [
  "CUSTOMER",
  "SALON_OWNER",
  "STAFF",
  "AGENT",
  "ADMIN",
];
const ANY = "ALL";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

type Props = {
  response: ApiResponse<AdminUserRow[]>;
  filters: AdminUserFilters;
  permissions: string[];
};

export function UsersClient(props: Props) {
  return (
    <FilterNavigationProvider>
      <UsersList {...props} />
    </FilterNavigationProvider>
  );
}

function UsersList({ response, filters, permissions }: Props) {
  const pathname = usePathname();
  const { navigate, isPending } = useFilterNavigation();
  const [q, setQ] = useState(filters.q ?? "");
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkOpen, setBulkOpen] = useState(false);

  const users =
    response.success && Array.isArray(response.data) ? response.data : [];
  const meta = response.meta as unknown as AdminListMeta | undefined;
  const roleCounts = meta?.roleCounts ?? {};
  const allCount = Object.values(roleCounts).reduce(
    (sum, n) => sum + (n ?? 0),
    0,
  );
  const canManage = can(permissions, "users.manage");

  // Any change but paging starts again from page 1 and drops the selection.
  const go = (next: Partial<AdminUserFilters>) => {
    const merged: AdminUserFilters = { ...filters, page: 1, ...next };
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(merged)) {
      if (
        value === undefined ||
        value === "" ||
        (key === "page" && value === 1)
      )
        continue;
      params.set(key, String(value));
    }
    setSelected([]);
    const query = params.toString();
    navigate(query ? `${pathname}?${query}` : pathname);
  };

  const chips: FilterChip[] = [
    { value: ANY, label: "All", count: allCount },
    ...ROLES.map((role) => ({
      value: role,
      label: ROLE_LABELS[role],
      count: roleCounts[role] ?? 0,
    })),
  ];

  const activeCount = [
    filters.status,
    filters.verified,
    filters.from,
    filters.to,
    filters.includeTest,
    filters.provider,
    filters.hasBookings,
  ].filter(Boolean).length;

  const selectFilter = (
    key: "status" | "verified" | "provider" | "hasBookings",
    label: string,
    options: { value: string; label: string }[],
  ) => (
    <Select
      value={filters[key] ?? ANY}
      onValueChange={(v) => go({ [key]: v === ANY ? undefined : v })}
    >
      <SelectTrigger className="w-full md:w-40" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ANY}>{`Any ${label.toLowerCase()}`}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const columns: Column<AdminUserRow>[] = [
    {
      key: "name",
      header: "User",
      sortable: true,
      mobile: "primary",
      cell: (u) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="h-8 w-8">
            {u.profilePhoto && <AvatarImage src={u.profilePhoto} alt="" />}
            <AvatarFallback className="text-xs">
              {initials(u.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-medium">
              {u.name}
              {u.isTest && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  test
                </span>
              )}
            </p>
            <p className="truncate text-xs text-muted-foreground">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Type",
      mobile: "eyebrow",
      cell: (u) => ROLE_LABELS[u.role] ?? u.role,
    },
    {
      key: "status",
      header: "Status",
      mobile: "trailing",
      cell: (u) => <ToneBadge status={u.status} />,
    },
    {
      key: "bookings",
      header: "Bookings",
      align: "right",
      cell: (u) => u.bookings,
    },
    {
      key: "wallet",
      header: "Wallet",
      align: "right",
      className: "hidden @4xl:table-cell",
      cell: (u) => formatBDT(u.walletBalanceMinor),
    },
    {
      key: "createdAt",
      header: "Joined",
      sortable: true,
      cell: (u) => formatDay(u.createdAt),
    },
    {
      key: "lastActiveAt",
      header: "Last active",
      sortable: true,
      className: "hidden @3xl:table-cell",
      cell: (u) => timeAgo(u.lastActiveAt),
    },
  ];

  const selectedUsers = users.filter((u) => selected.includes(u.id));

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Users"
        description="Every account on SalonKhuji. Contact details are masked here; open a user to see more."
        actions={
          <Button
            variant="outline"
            disabled
            title="CSV export arrives with the finance console"
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        }
      />

      <FilterBar
        pending={isPending}
        search={{
          value: q,
          onChange: setQ,
          onSubmit: (value) => go({ q: value.trim() || undefined }),
          placeholder: "Name, email, phone or ID",
          label: "Search users",
        }}
        chips={{
          value: filters.role ?? ANY,
          options: chips,
          onChange: (role) => go({ role: role === ANY ? undefined : role }),
          label: "Account type",
        }}
        extra={
          <>
            {selectFilter("status", "Status", [
              { value: "ACTIVE", label: "Active" },
              { value: "SUSPENDED", label: "Suspended" },
              { value: "BLOCKED", label: "Blocked" },
              { value: "INACTIVE", label: "Inactive" },
            ])}
            {selectFilter("verified", "Email", [
              { value: "true", label: "Verified" },
              { value: "false", label: "Not verified" },
            ])}
            {selectFilter("provider", "Sign-in", [
              { value: "PASSWORD", label: "Password" },
              { value: "GOOGLE", label: "Google" },
            ])}
            {selectFilter("hasBookings", "Bookings", [
              { value: "true", label: "Has bookings" },
              { value: "false", label: "No bookings" },
            ])}
            <div className="flex items-center gap-2">
              <Label
                htmlFor="joined-from"
                className="shrink-0 text-xs text-muted-foreground"
              >
                Joined
              </Label>
              <Input
                id="joined-from"
                type="date"
                aria-label="Joined from"
                className="w-full md:w-36"
                value={filters.from ?? ""}
                onChange={(e) => go({ from: e.target.value || undefined })}
              />
              <Input
                type="date"
                aria-label="Joined to"
                className="w-full md:w-36"
                value={filters.to ?? ""}
                onChange={(e) => go({ to: e.target.value || undefined })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="include-test"
                checked={filters.includeTest === "true"}
                onCheckedChange={(on) =>
                  go({ includeTest: on ? "true" : undefined })
                }
              />
              <Label htmlFor="include-test" className="text-sm">
                Include test data
              </Label>
            </div>
          </>
        }
        activeCount={activeCount}
        onClear={() =>
          go({
            status: undefined,
            verified: undefined,
            from: undefined,
            to: undefined,
            includeTest: undefined,
            provider: undefined,
            hasBookings: undefined,
          })
        }
      />

      {!response.success ? (
        <ErrorState title="Couldn't load users" message={response.message} />
      ) : (
        <PendingRegion>
          <DataList
            items={users}
            rowKey={(u) => u.id}
            columns={columns}
            density="compact"
            selectable={canManage}
            selected={selected}
            onSelectedChange={setSelected}
            rowHref={(u) => `/dashboard/admin/users/${u.id}`}
            caption="Users"
            empty={
              <EmptyState
                icon={Users}
                title="No users match"
                description={
                  activeCount || filters.q
                    ? "Try clearing a filter."
                    : undefined
                }
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
          itemLabel="users"
          disabled={isPending}
          onPageChange={(page) => go({ ...filters, page })}
        />
      )}

      {canManage && selected.length > 0 && (
        <BulkActionBar count={selected.length} onClear={() => setSelected([])}>
          <Button
            size="sm"
            variant="destructive"
            disabled={selected.length > BULK_LIMIT}
            title={
              selected.length > BULK_LIMIT
                ? `At most ${BULK_LIMIT} at a time`
                : undefined
            }
            onClick={() => setBulkOpen(true)}
          >
            <UserX className="mr-1.5 h-4 w-4" />
            Suspend
          </Button>
        </BulkActionBar>
      )}

      {bulkOpen && (
        <StatusDialog
          open={bulkOpen}
          onOpenChange={setBulkOpen}
          action="SUSPENDED"
          users={selectedUsers.map((u) => ({ id: u.id, name: u.name }))}
          onDone={() => setSelected([])}
        />
      )}
    </div>
  );
}
