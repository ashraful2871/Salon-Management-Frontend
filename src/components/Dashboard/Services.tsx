"use client";
import { useOptimistic, useState, useTransition } from "react";
import {
  Banknote,
  Clock,
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  Search,
  Tags,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AddServiceModal from "./AddServiceModal";
import { deleteService } from "@/services/service/deleteService";
import { showResultToast } from "@/components/Shared/showResultToast";
import { formatBDT } from "@/lib/money";
import type { ApiResponse, SalonService } from "@/lib/api-types";
import { PageHeader } from "@/components/Shared/PageHeader";
import { StatCard } from "@/components/Shared/StatCard";
import { ConfirmDialog } from "@/components/Shared/ConfirmDialog";
import { DataList, type Column } from "@/components/Shared/DataList";
import { FilterBar } from "@/components/Shared/FilterBar";
import { EmptyState } from "@/components/Shared/EmptyState";
import { humanizeStatus } from "@/components/Shared/ToneBadge";

type SalonOption = { id: string; name: string };

const categoryOf = (service: SalonService) =>
  service.category ? humanizeStatus(service.category) : "Other";

const average = (values: number[]) =>
  values.length ? Math.round(values.reduce((sum, v) => sum + v, 0) / values.length) : 0;

export default function Services({
  servicesResponse,
  salonsResponse,
}: {
  servicesResponse: ApiResponse<SalonService[]>;
  salonsResponse: ApiResponse<SalonOption[]>;
}) {
  const [query, setQuery] = useState("");
  const [, startTransition] = useTransition();

  // The form remounts on every open (a new key), so it starts from the row.
  const [formOpen, setFormOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [editing, setEditing] = useState<SalonService | null>(null);
  const openForm = (service: SalonService | null) => {
    setEditing(service);
    setFormKey((key) => key + 1);
    setFormOpen(true);
  };

  // Kept apart from `open`, so the text doesn't blank while the dialog fades out.
  const [deleteTarget, setDeleteTarget] = useState<SalonService | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const serverServices = Array.isArray(servicesResponse?.data)
    ? servicesResponse.data
    : [];
  // A deleted service leaves the list at once and comes back if the API refuses.
  const [services, removeService] = useOptimistic(
    serverServices,
    (list: SalonService[], id: string) => list.filter((s) => s.id !== id),
  );
  const salons = Array.isArray(salonsResponse?.data) ? salonsResponse.data : [];
  const manySalons = salons.length > 1;

  const needle = query.trim().toLowerCase();
  const visible = needle
    ? services.filter(
        (s) =>
          s.name.toLowerCase().includes(needle) ||
          (s.category ?? "").toLowerCase().includes(needle),
      )
    : services;

  const categories = new Set(services.map((s) => s.category ?? "OTHER"));

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setConfirmOpen(false);

    startTransition(async () => {
      removeService(id);
      const res = await deleteService(id);
      showResultToast(res, "Service deleted", "Failed to delete the service");
    });
  };

  const columns: Column<SalonService>[] = [
    {
      key: "name",
      header: "Service",
      mobile: "primary",
      cell: (s) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{s.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {[categoryOf(s), manySalons && s.salon?.name].filter(Boolean).join(" · ")}
          </p>
        </div>
      ),
      mobileCell: (s) => s.name,
    },
    {
      // Phone cards only: the table shows it under the name.
      key: "category",
      header: "Category",
      mobile: "secondary",
      className: "hidden",
      cell: (s) =>
        [categoryOf(s), manySalons && s.salon?.name].filter(Boolean).join(" · "),
    },
    {
      key: "duration",
      header: "Duration",
      mobile: "meta",
      cell: (s) => (
        <span className="whitespace-nowrap tabular-nums">
          {s.duration ? `${s.duration} min` : "—"}
        </span>
      ),
    },
    {
      key: "price",
      header: "Price",
      align: "right",
      mobile: "meta",
      cell: (s) => (
        <span className="whitespace-nowrap font-medium tabular-nums">
          {formatBDT(s.priceMinor ?? 0)}
        </span>
      ),
    },
  ];

  const rowActions = (s: SalonService) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon-sm"
          className="shrink-0"
          aria-label={`More actions for ${s.name}`}
        >
          <MoreHorizontal aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onSelect={() => openForm(s)}>
          <Pencil aria-hidden="true" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => {
            setDeleteTarget(s);
            setConfirmOpen(true);
          }}
        >
          <Trash2 aria-hidden="true" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Services"
        description="What your salons offer, for how long and at what price."
        actions={
          <Button onClick={() => openForm(null)}>
            <Plus aria-hidden="true" />
            Add service
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard label="Total services" value={services.length} icon={Package} />
        <StatCard label="Categories" value={categories.size} icon={Tags} />
        <StatCard
          label="Avg. duration"
          value={`${average(services.map((s) => s.duration ?? 0))} min`}
          icon={Clock}
        />
        <StatCard
          label="Avg. price"
          value={formatBDT(average(services.map((s) => s.priceMinor ?? 0)))}
          icon={Banknote}
        />
      </div>

      <div className="space-y-4">
        {services.length > 0 && (
          <FilterBar
            search={{
              value: query,
              onChange: setQuery,
              onSubmit: setQuery,
              placeholder: "Search services",
              label: "Search services",
            }}
            activeCount={needle ? 1 : 0}
            onClear={() => setQuery("")}
          />
        )}

        <DataList
          items={visible}
          rowKey={(s) => s.id}
          columns={columns}
          rowActions={rowActions}
          caption="Services"
          empty={
            <div className="rounded-2xl border border-border bg-surface px-4">
              {services.length === 0 ? (
              <EmptyState
                icon={Package}
                title="No services yet"
                description="Add what you offer, then generate slots so customers can book it."
                action={
                  <Button onClick={() => openForm(null)}>
                    <Plus aria-hidden="true" />
                    Add your first service
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={Search}
                title="No services match"
                description={`Nothing is called "${query.trim()}".`}
                action={
                  <Button variant="outline" onClick={() => setQuery("")}>
                    Clear search
                  </Button>
                }
              />
              )}
            </div>
          }
        />
      </div>

      <AddServiceModal
        key={formKey}
        open={formOpen}
        setOpen={setFormOpen}
        salons={salons}
        service={editing}
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        tone="danger"
        title="Delete this service?"
        description={`Customers will no longer be able to book ${
          deleteTarget ? `"${deleteTarget.name}"` : "it"
        }. This can't be undone.`}
        confirmLabel="Delete service"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
