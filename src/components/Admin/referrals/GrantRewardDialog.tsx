"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStepUp } from "@/components/Admin/StepUpDialog";
import { ResponsiveDialog } from "@/components/Shared/ResponsiveDialog";
import { showResultToast } from "@/components/Shared/showResultToast";
import { formatBDT, toMinor } from "@/lib/money";
import { rewardDiscountMinor } from "@/lib/referral";
import { cn } from "@/lib/utils";
import { searchAdmin } from "@/services/admin/searchAdmin";
import type { AdminSearchHit } from "@/services/admin/types";
import { grantReward } from "@/services/referral/grantReward";
import type { RewardScope } from "@/services/referral/types";
import { SCOPE_LABELS } from "./labels";

/** The example the preview prices: a ৳1,000 booking. */
const SAMPLE_MINOR = 100_000;

export type GrantDefaults = { percent: number; maxDiscountMinor: number; validDays: number; scope: RewardScope };

type Person = { id: string; name: string; subtitle?: string | null };

/**
 * Grant a MANUAL_GRANT reward: pick a customer (the admin search), set the
 * percent, cap, validity and where it works, give a reason, see what it takes
 * off a ৳1,000 booking. Tier 3: the step-up prompt comes up on save. The API
 * refuses anyone but an active customer.
 */
export function GrantRewardDialog({
  open,
  onOpenChange,
  defaults,
  user,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Starting values (the referrer's terms in force). */
  defaults: GrantDefaults;
  /** Prefilled from User 360; the search is hidden. */
  user?: Person;
  onDone?: () => void;
}) {
  const ids = useId();
  const [person, setPerson] = useState<Person | null>(user ?? null);
  const [term, setTerm] = useState("");
  const [hits, setHits] = useState<AdminSearchHit[]>([]);
  const [searching, startSearch] = useTransition();
  const [percent, setPercent] = useState(String(defaults.percent));
  const [capTaka, setCapTaka] = useState(String(defaults.maxDiscountMinor / 100));
  const [days, setDays] = useState(String(defaults.validDays));
  const [scope, setScope] = useState<RewardScope>(defaults.scope);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { run, dialog } = useStepUp();

  // Debounced admin search; only people come back here.
  useEffect(() => {
    const q = term.trim();
    if (user || q.length < 2) return;
    const timer = setTimeout(() => {
      startSearch(async () => {
        const result = await searchAdmin(q);
        setHits(result.success ? (result.data ?? []).filter((h) => h.kind === "user") : []);
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [term, user]);

  const p = Number(percent);
  const cap = Number(capTaka);
  const d = Number(days);
  const percentOk = Number.isInteger(p) && p >= 1 && p <= 50;
  const capOk = capTaka.trim() !== "" && Number.isFinite(cap) && cap >= 0 && cap <= 5000;
  const daysOk = Number.isInteger(d) && d >= 1 && d <= 365;
  const ready = !!person && percentOk && capOk && daysOk && reason.trim().length >= 3;
  const capMinor = capOk ? toMinor(cap) : 0;
  const sample = percentOk && capOk ? rewardDiscountMinor(SAMPLE_MINOR, p * 100, capMinor) : 0;

  const reset = () => {
    setPerson(user ?? null);
    setTerm("");
    setHits([]);
    setPercent(String(defaults.percent));
    setCapTaka(String(defaults.maxDiscountMinor / 100));
    setDays(String(defaults.validDays));
    setScope(defaults.scope);
    setReason("");
    setError(null);
  };

  const close = (next: boolean) => {
    if (pending) return;
    if (!next) reset();
    onOpenChange(next);
  };

  const submit = () => {
    if (!ready || !person) return;
    setError(null);
    startTransition(async () => {
      const result = await run(() =>
        grantReward({ userId: person.id, percent: p, maxDiscountMinor: capMinor, validDays: d, scope, reason: reason.trim() }),
      );
      if (!result.success) {
        setError(result.message);
        return;
      }
      showResultToast(result);
      reset();
      onOpenChange(false);
      onDone?.();
    });
  };

  return (
    <>
      <ResponsiveDialog
        open={open}
        onOpenChange={close}
        title={user ? `Grant ${user.name} a reward` : "Grant a reward"}
        description="A one-off discount reward, paid by the platform like a referral reward. The customer is told about it."
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => close(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="button" onClick={submit} disabled={!ready || pending}>
              {pending && <Loader2 aria-hidden className="animate-spin" />}
              Grant reward
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {!user && (
            <div className="space-y-1.5">
              <Label htmlFor={`${ids}-who`}>Customer</Label>
              {person ? (
                <div className="flex items-center justify-between gap-2 rounded-xl border border-border px-3 py-2 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{person.name}</span>
                    {person.subtitle && <span className="block truncate text-xs text-muted-foreground">{person.subtitle}</span>}
                  </span>
                  <Button type="button" variant="ghost" size="icon" className="size-8" aria-label="Choose someone else" onClick={() => setPerson(null)}>
                    <X aria-hidden className="size-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id={`${ids}-who`}
                      value={term}
                      onChange={(e) => setTerm(e.target.value)}
                      placeholder="Name, email or phone"
                      className="pl-9"
                      autoComplete="off"
                      aria-describedby={`${ids}-who-help`}
                    />
                    {searching && (
                      <Loader2 aria-hidden className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  <p id={`${ids}-who-help`} className="text-xs text-muted-foreground">
                    Customers only; the API refuses any other account.
                  </p>
                  {term.trim().length >= 2 && hits.length > 0 && (
                    <ul aria-label="Matching people" className="max-h-48 divide-y divide-border overflow-y-auto rounded-xl border border-border">
                      {hits.map((h) => (
                        <li key={h.id}>
                          <button
                            type="button"
                            className="block w-full px-3 py-2 text-left text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                            onClick={() => setPerson({ id: h.id, name: h.title, subtitle: h.subtitle })}
                          >
                            <span className="block truncate font-medium">{h.title}</span>
                            {h.subtitle && <span className="block truncate text-xs text-muted-foreground">{h.subtitle}</span>}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {term.trim().length >= 2 && !searching && hits.length === 0 && (
                    <p className="text-sm text-muted-foreground">Nobody matches.</p>
                  )}
                </>
              )}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            <NumberField id={`${ids}-pct`} label="Percent off" suffix="%" value={percent} onChange={setPercent} error={percentOk ? null : "1 to 50"} />
            <NumberField id={`${ids}-cap`} label="Cap (৳, 0 = none)" value={capTaka} onChange={setCapTaka} error={capOk ? null : "0 to 5,000"} />
            <NumberField id={`${ids}-days`} label="Valid for" suffix="days" value={days} onChange={setDays} error={daysOk ? null : "1 to 365"} />
          </div>

          <fieldset className="space-y-1.5">
            <legend className="text-sm font-medium">Where it works</legend>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(SCOPE_LABELS) as RewardScope[]).map((s) => (
                <label
                  key={s}
                  className={cn(
                    "inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border px-3 text-sm",
                    scope === s ? "border-primary bg-primary-soft" : "border-border hover:bg-surface-subtle",
                  )}
                >
                  <input
                    type="radio"
                    name={`${ids}-scope`}
                    value={s}
                    checked={scope === s}
                    onChange={() => setScope(s)}
                    className="size-4 accent-primary"
                  />
                  {SCOPE_LABELS[s]}
                </label>
              ))}
            </div>
          </fieldset>

          <p className="rounded-xl bg-surface-subtle p-3 text-sm" aria-live="polite">
            On a {formatBDT(SAMPLE_MINOR)} booking:{" "}
            <span className="font-semibold">{sample > 0 ? `−${formatBDT(sample)}` : "no discount"}</span>
          </p>

          <div className="space-y-1.5">
            <Label htmlFor={`${ids}-reason`}>
              Reason <span className="font-normal text-muted-foreground">(required, kept on the audit log)</span>
            </Label>
            <Textarea id={`${ids}-reason`} value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={500} aria-required />
          </div>

          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
        </div>
      </ResponsiveDialog>
      {dialog}
    </>
  );
}

function NumberField({
  id,
  label,
  value,
  onChange,
  suffix,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  suffix?: string;
  error: string | null;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : undefined}
        />
        {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
      </div>
      {error && (
        <p id={`${id}-err`} className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
