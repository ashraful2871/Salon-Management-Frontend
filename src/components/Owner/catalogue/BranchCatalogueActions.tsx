"use client";

import { useState, useTransition } from "react";
import { Copy, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResponsiveDialog } from "@/components/Shared/ResponsiveDialog";
import { showResultToast } from "@/components/Shared/showResultToast";
import { formatBDT, toMinor } from "@/lib/money";
import type { SalonService } from "@/lib/api-types";
import { changePriceAcrossBranches, copyServicesToBranches } from "@/services/owner/catalogueActions";
import type { BulkPriceInput, BulkPriceResult } from "@/services/owner/catalogue-types";
import { BranchChecklist, type BranchOption } from "./BranchChecklist";

/**
 * Services page, owners with two or more branches: copy services to other
 * branches, and change one service's price across branches (preview → confirm).
 */
export function BranchCatalogueActions({
  branches,
  services,
  currentSalonId,
}: {
  /** Every branch the caller owns. */
  branches: BranchOption[];
  /** The services on screen (one branch, or all). */
  services: SalonService[];
  currentSalonId?: string | null;
}) {
  const [copyOpen, setCopyOpen] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);
  if (branches.length < 2) return null;

  return (
    <>
      <Button variant="outline" onClick={() => setCopyOpen(true)}>
        <Copy aria-hidden="true" />
        Copy to branches
      </Button>
      <Button variant="outline" onClick={() => setPriceOpen(true)}>
        <Tag aria-hidden="true" />
        Change price across branches
      </Button>
      {copyOpen && (
        <CopyServicesDialog
          open={copyOpen}
          onOpenChange={setCopyOpen}
          branches={branches}
          services={services}
          defaultFrom={currentSalonId ?? branches[0].id}
        />
      )}
      {priceOpen && (
        <BulkPriceDialog open={priceOpen} onOpenChange={setPriceOpen} branches={branches} services={services} />
      )}
    </>
  );
}

const selectClass =
  "h-10 w-full rounded-md border border-input bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function CopyServicesDialog({
  open,
  onOpenChange,
  branches,
  services,
  defaultFrom,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branches: BranchOption[];
  services: SalonService[];
  defaultFrom: string;
}) {
  const [from, setFrom] = useState(defaultFrom);
  const [targets, setTargets] = useState<string[]>([]);
  // Empty = every service at the source branch.
  const [picked, setPicked] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  const sourceServices = services.filter((s) => s.salonId === from);
  const others = branches.filter((b) => b.id !== from);

  const submit = () =>
    startTransition(async () => {
      const res = await copyServicesToBranches({
        fromSalonId: from,
        toSalonIds: targets,
        ...(picked.length ? { serviceIds: picked } : {}),
      });
      showResultToast(res, "Services copied", "Couldn't copy the services");
      if (res.success) onOpenChange(false);
    });

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Copy services to branches"
      description="Name, category, price, duration, description and photos are copied. A branch that already has a service by that name keeps its own."
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={submit} loading={pending} disabled={!targets.length}>
            Copy to {targets.length || ""} {targets.length === 1 ? "branch" : "branches"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="copy-from">From</Label>
          <select
            id="copy-from"
            className={selectClass}
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPicked([]);
              setTargets((t) => t.filter((id) => id !== e.target.value));
            }}
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        {sourceServices.length > 0 && (
          <div className="space-y-1.5">
            <Label>Services</Label>
            <BranchChecklist
              branches={sourceServices.map((s) => ({ id: s.id, name: `${s.name} · ${formatBDT(s.priceMinor ?? 0)}` }))}
              selected={picked}
              onChange={setPicked}
              idPrefix="copy-svc"
            />
            <p className="text-xs text-muted-foreground">Pick none to copy every service.</p>
          </div>
        )}
        <div className="space-y-1.5">
          <Label>To</Label>
          <BranchChecklist branches={others} selected={targets} onChange={setTargets} idPrefix="copy-to" />
        </div>
      </div>
    </ResponsiveDialog>
  );
}

function BulkPriceDialog({
  open,
  onOpenChange,
  branches,
  services,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branches: BranchOption[];
  services: SalonService[];
}) {
  const names = [...new Set(services.map((s) => s.name.trim()))].sort((a, b) => a.localeCompare(b));
  const [serviceName, setServiceName] = useState(names[0] ?? "");
  const [salonIds, setSalonIds] = useState<string[]>(branches.map((b) => b.id));
  const [mode, setMode] = useState<"price" | "percent">("price");
  const [amount, setAmount] = useState("");
  const [preview, setPreview] = useState<BulkPriceResult | null>(null);
  const [pending, startTransition] = useTransition();

  const value = Number(amount);
  const amountOk = amount !== "" && Number.isFinite(value) && (mode === "price" ? value >= 1 : value >= -90 && value <= 500 && value !== 0);
  const valid = !!serviceName.trim() && salonIds.length > 0 && amountOk;

  const body = (): BulkPriceInput => ({
    serviceName: serviceName.trim(),
    salonIds,
    ...(mode === "price" ? { priceMinor: toMinor(value) } : { percentChange: value }),
  });

  // Any edit invalidates the preview: what is confirmed is what was previewed.
  const edit = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setPreview(null);
  };

  const run = (dryRun: boolean) =>
    startTransition(async () => {
      const res = await changePriceAcrossBranches(body(), dryRun);
      if (!res.success || !res.data) {
        showResultToast(res, "", "Couldn't change the prices");
        if (!dryRun) setPreview(null);
        return;
      }
      if (dryRun) {
        setPreview(res.data);
        return;
      }
      showResultToast(res, "Prices changed");
      onOpenChange(false);
    });

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Change price across branches"
      description="Bookings already made keep the price they were booked at."
      className="sm:max-w-2xl"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          {preview ? (
            <Button onClick={() => run(false)} loading={pending} disabled={!preview.changed}>
              Change {preview.changed} {preview.changed === 1 ? "price" : "prices"}
            </Button>
          ) : (
            <Button onClick={() => run(true)} loading={pending} disabled={!valid}>
              Preview
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="bulk-service">Service</Label>
          <Input
            id="bulk-service"
            list="bulk-service-names"
            value={serviceName}
            onChange={(e) => edit(setServiceName)(e.target.value)}
            placeholder="Haircut"
          />
          <datalist id="bulk-service-names">
            {names.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
          <p className="text-xs text-muted-foreground">Matched by name at each branch, ignoring case.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="bulk-mode">Change</Label>
            <select
              id="bulk-mode"
              className={selectClass}
              value={mode}
              onChange={(e) => edit(setMode)(e.target.value as "price" | "percent")}
            >
              <option value="price">Set a new price (৳)</option>
              <option value="percent">By a percentage (%)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bulk-amount">{mode === "price" ? "New price (৳)" : "Change (%)"}</Label>
            <Input
              id="bulk-amount"
              type="number"
              inputMode="decimal"
              step={mode === "price" ? 1 : 0.5}
              value={amount}
              onChange={(e) => edit(setAmount)(e.target.value)}
              placeholder={mode === "price" ? "350" : "10 or -5"}
            />
          </div>
        </div>
        {mode === "percent" && (
          <p className="text-xs text-muted-foreground">New prices are rounded to whole taka.</p>
        )}
        <div className="space-y-1.5">
          <Label>Branches</Label>
          <BranchChecklist branches={branches} selected={salonIds} onChange={edit(setSalonIds)} idPrefix="bulk-to" />
        </div>

        {preview && (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {preview.changed} to change{preview.unchanged ? ` · ${preview.unchanged} already at that price` : ""}
              {preview.missing.length ? ` · ${preview.missing.length} without this service` : ""}
            </p>
            {preview.rows.length > 0 && (
              <div className="max-h-64 overflow-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-muted text-left text-xs text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 font-medium">Branch</th>
                      <th className="px-3 py-2 text-right font-medium">Now</th>
                      <th className="px-3 py-2 text-right font-medium">New</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {preview.rows.map((r) => (
                      <tr key={r.serviceId}>
                        <td className="max-w-[12rem] truncate px-3 py-2">{r.salonName}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{formatBDT(r.beforeMinor)}</td>
                        <td
                          className={`px-3 py-2 text-right font-medium tabular-nums ${r.afterMinor === r.beforeMinor ? "text-muted-foreground" : ""}`}
                        >
                          {formatBDT(r.afterMinor)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </ResponsiveDialog>
  );
}
