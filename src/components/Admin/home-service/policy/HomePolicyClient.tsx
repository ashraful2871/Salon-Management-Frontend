"use client";

import { useId, useState, type ReactNode } from "react";
import { BadgeCheck, CircleAlert, Lock, PencilLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ReasonDialog } from "@/components/Admin/ReasonDialog";
import { formatSettingValue, SETTING_REASONS } from "@/components/Admin/settings/format";
import { saveSettings, type SettingEdit } from "@/components/Admin/settings/saveSettings";
import { fromDraft, same, SettingField, toDraft } from "@/components/Admin/settings/SettingField";
import { reasonText } from "@/components/Admin/users/labels";
import { ErrorState } from "@/components/Shared/ErrorState";
import { PageHeader } from "@/components/Shared/PageHeader";
import { SaveBar } from "@/components/Shared/SaveBar";
import { showResultToast } from "@/components/Shared/showResultToast";
import { can } from "@/lib/admin-permissions";
import type { ApiResponse } from "@/lib/api-types";
import { buildDisclaimer, policyFromSettings, type DisclaimerLang } from "@/lib/home-policy";
import { formatBDT } from "@/lib/money";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";
import type { AdminSetting } from "@/services/admin/settings/types";
import { getHomePolicyHistory } from "@/services/home-service/getHomePolicyHistory";
import type { HomePolicyPage } from "@/services/home-service/getHomePolicy";
import type { HomeCancelPolicy } from "@/services/home-service/types";
import { feesInForce, FEE_KEYS, outcomeRows, sampleAdvance, SAMPLE_TOTAL_MINOR } from "./policy-preview";

const PREFIX = "homeService.";
const TIME_KEYS = new Set(["dayStartBound", "dayEndBound", "ladiesLastStart"].map((k) => PREFIX + k));
const NEW_ONLY = "Applies to new bookings only.";

const POLICIES: { value: HomeCancelPolicy; title: string; line: string; wording: string }[] = [
  {
    value: "FREE",
    title: "Free",
    line: "The customer can cancel any time before the visit and gets the whole advance back.",
    wording: "disclaimer.free",
  },
  {
    value: "WINDOW",
    title: "Cancellation window",
    line: "Free until a set time before the visit. After that, part of the advance is kept.",
    wording: "disclaimer.window",
  },
  {
    value: "NON_REFUNDABLE",
    title: "Non-refundable",
    line: "The advance is kept if the customer cancels or isn't home.",
    wording: "disclaimer.nonRefundable",
  },
];

type Draft = Record<string, unknown>;
type Parsed = { value: unknown } | { error: string };
type Confirming = "save" | "fees" | null;

const checkDraft = (setting: AdminSetting, draft: unknown): Parsed => {
  if (TIME_KEYS.has(setting.key) && !/^\d{2}:\d{2}$/.test(String(draft))) return { error: "Enter a time" };
  return fromDraft(setting, draft);
};

export function HomePolicyClient({
  response,
  permissions,
}: {
  response: ApiResponse<HomePolicyPage>;
  permissions: string[];
}) {
  // A save bumps `version`, which remounts with the server's values. A change
  // sent for approval bumps nothing, so this clears that draft too.
  const [saves, setSaves] = useState(0);
  const data = response.success ? response.data : undefined;

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Fees & policy"
        description="Every Home Service fee and cancellation rule. A change reaches new bookings within about a minute; a booking already made keeps its own terms."
      />
      {!data ? (
        <ErrorState title="Couldn't load the Home Service policy" message={response.message} />
      ) : (
        <PolicyForm
          key={`${saves}:${data.settings.map((s) => s.version).join(",")}`}
          data={data}
          permissions={permissions}
          onSaved={() => setSaves((n) => n + 1)}
        />
      )}
    </div>
  );
}

function PolicyForm({
  data,
  permissions,
  onSaved,
}: {
  data: HomePolicyPage;
  permissions: string[];
  onSaved: () => void;
}) {
  const { settings, policy: saved } = data;
  const formId = useId();
  const canPolicy = can(permissions, "homeservice.policy");
  const byKey = new Map(settings.map((s) => [s.key, s]));
  const initial = (): Draft => Object.fromEntries(settings.map((s) => [s.key, toDraft(s, s.value)]));
  const [draft, setDraft] = useState<Draft>(initial);
  const [confirming, setConfirming] = useState<Confirming>(null);
  const [wordingOpen, setWordingOpen] = useState(false);

  const set = (key: string, value: unknown) => setDraft((d) => ({ ...d, [key]: value }));

  const parsed = new Map<string, Parsed>(settings.map((s) => [s.key, checkDraft(s, draft[s.key])]));
  const valueOf = (key: string) => {
    const p = parsed.get(key);
    return p && "value" in p ? p.value : byKey.get(key)?.value;
  };

  // The API checks each key alone, so a pair that contradicts itself stops here.
  const crossErrors = new Map<string, string>();
  const text = (name: string) => String(valueOf(PREFIX + name));
  if (Number(valueOf(`${PREFIX}minOrderMinMinor`)) > Number(valueOf(`${PREFIX}minOrderMaxMinor`))) {
    crossErrors.set(`${PREFIX}minOrderMaxMinor`, "Can't be below the lowest minimum order");
  }
  if (text("dayStartBound") >= text("dayEndBound")) {
    crossErrors.set(`${PREFIX}dayEndBound`, "Must be after the earliest start");
  }
  if (text("ladiesLastStart") > text("dayEndBound") || text("ladiesLastStart") < text("dayStartBound")) {
    crossErrors.set(`${PREFIX}ladiesLastStart`, "Must be inside the earliest start and latest end");
  }

  const changed = settings.filter((s) => !same(draft[s.key], toDraft(s, s.value)));
  const errorOf = (key: string) => {
    const p = parsed.get(key);
    if (p && "error" in p && changed.some((s) => s.key === key)) return p.error;
    return changed.length ? (crossErrors.get(key) ?? null) : null;
  };
  const invalid = changed.some((s) => "error" in (parsed.get(s.key) as Parsed)) || (changed.length > 0 && crossErrors.size > 0);
  const edits: SettingEdit[] = changed
    .filter((s) => !same(valueOf(s.key), s.value))
    .map((s) => ({ setting: s, value: valueOf(s.key) }));

  const feeEdits: SettingEdit[] = FEE_KEYS.flatMap((key) => {
    const s = byKey.get(key);
    return s && !same(s.value, s.default) ? [{ setting: s, value: s.default }] : [];
  });

  const policy = policyFromSettings(settings, Object.fromEntries(settings.map((s) => [s.key, valueOf(s.key)])));
  const advancePercent = Number(valueOf(`${PREFIX}advancePercent`));
  const advance = sampleAdvance(advancePercent);
  const rows = outcomeRows(policy, advance);
  const inForce = feesInForce(saved, settings);
  const selected = POLICIES.find((p) => p.value === policy.policy) ?? POLICIES[0];

  const field = (
    name: string,
    options: { note?: ReactNode; control?: "textarea" | "time" | "none" } = {},
  ) => {
    const setting = byKey.get(PREFIX + name);
    if (!setting) return null;
    const money = name.endsWith("Minor") ? formatBDT(Number(valueOf(setting.key))) : null;
    return (
      <SettingField
        key={setting.key}
        setting={setting}
        draft={draft[setting.key]}
        error={errorOf(setting.key)}
        canEdit={permissions.includes(setting.permission)}
        onChange={(value) => set(setting.key, value)}
        loadHistory={getHomePolicyHistory}
        control={options.control ?? (TIME_KEYS.has(setting.key) ? "time" : undefined)}
        note={
          money || options.note ? (
            <>
              {money && `That is ${money}. `}
              {options.note}
            </>
          ) : undefined
        }
      />
    );
  };

  const pendingEdits = confirming === "fees" ? feeEdits : edits;

  return (
    <>
      <FeesBanner
        fees={inForce}
        canReset={canPolicy}
        nothingToReset={feeEdits.length === 0}
        dirty={changed.length > 0}
        onReset={() => setConfirming("fees")}
      />

      {!canPolicy && (
        <p className="flex items-center gap-2 rounded-xl border border-border bg-surface p-3 text-sm text-muted-foreground">
          <Lock aria-hidden className="size-4 shrink-0" />
          You can view but not change these.
        </p>
      )}

      <form
        id={formId}
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (edits.length && !invalid) setConfirming("save");
        }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Customer cancellation policy</CardTitle>
            <CardDescription>What a customer gets back when they cancel or aren&apos;t home.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {field("customerCancelPolicy", { control: "none" })}

            <fieldset className="grid gap-3 md:grid-cols-3">
              <legend className="sr-only">Customer cancellation policy</legend>
              {POLICIES.map((option) => {
                const checked = policy.policy === option.value;
                const disabled = !canPolicy;
                return (
                  <label
                    key={option.value}
                    className={cn(
                      "flex gap-3 rounded-2xl border p-4 text-sm transition-colors",
                      checked ? "border-primary bg-primary-soft" : "border-border",
                      disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer hover:bg-surface-subtle",
                    )}
                  >
                    <input
                      type="radio"
                      name={`${formId}-policy`}
                      value={option.value}
                      checked={checked}
                      disabled={disabled}
                      onChange={() => set(`${PREFIX}customerCancelPolicy`, option.value)}
                      className="mt-0.5 size-4 shrink-0 accent-primary"
                    />
                    <span className="min-w-0 space-y-1">
                      <span className="block font-semibold">{option.title}</span>
                      <span className="block text-muted-foreground">{option.line}</span>
                    </span>
                  </label>
                );
              })}
            </fieldset>

            <div className="divide-y">
              {policy.policy === "WINDOW" && field("freeCancelHours")}
              {policy.policy === "WINDOW" && field("lateCancelPercent")}
              {policy.policy === "NON_REFUNDABLE" &&
                field("nonRefundableGraceMinutes", {
                  note: `The visit must also be at least ${policy.freeCancelHours} hours away.`,
                })}
              {field("noShowPercent", {
                note:
                  policy.policy === "NON_REFUNDABLE"
                    ? "Non-refundable keeps 100% on a no-show, so this has no effect under this policy."
                    : undefined,
              })}
            </div>

            <p className="rounded-xl border border-info/30 bg-info-soft/60 p-3 text-sm">
              If the salon, the expert or {SITE.name} cancels, the customer always gets 100% back automatically.
            </p>

            <section aria-labelledby="disclaimer-title" className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 id="disclaimer-title" className="text-sm font-semibold">
                  What the customer sees
                </h3>
                <Button type="button" variant="outline" size="sm" onClick={() => setWordingOpen((v) => !v)}>
                  <PencilLine aria-hidden className="size-3.5" />
                  Edit wording
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {(["en", "bn"] as DisclaimerLang[]).map((lang) => (
                  <figure key={lang} className="min-w-0 rounded-xl bg-surface-subtle p-3">
                    <figcaption className="mb-1 text-xs font-medium text-muted-foreground">
                      {lang === "en" ? "English" : "বাংলা"}
                    </figcaption>
                    <blockquote lang={lang} className="text-sm whitespace-pre-line">
                      {buildDisclaimer(policy, advance, lang)}
                    </blockquote>
                  </figure>
                ))}
              </div>
              {wordingOpen &&
                field(selected.wording, {
                  control: "textarea",
                  note: "Empty uses the generated text above. Your wording shows as written in both languages, and its amounts don't change with the booking.",
                })}
            </section>

            <section aria-labelledby="outcome-title" className="space-y-2">
              <h3 id="outcome-title" className="text-sm font-semibold">
                Who gets what
              </h3>
              <p className="text-sm text-muted-foreground">
                A sample {formatBDT(SAMPLE_TOTAL_MINOR)} visit, advance {formatBDT(advance)} ({advancePercent}%).
              </p>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <caption className="sr-only">Outcome of each ending for the sample visit</caption>
                  <thead className="bg-surface-subtle text-xs text-muted-foreground">
                    <tr>
                      <th scope="col" className="px-3 py-2 text-left font-medium">
                        If
                      </th>
                      <th scope="col" className="px-3 py-2 text-right font-medium">
                        Customer back
                      </th>
                      <th scope="col" className="px-3 py-2 text-right font-medium">
                        Salon
                      </th>
                      <th scope="col" className="px-3 py-2 text-right font-medium">
                        {SITE.name}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {rows.map((row) => (
                      <tr key={row.label}>
                        <th scope="row" className="px-3 py-2 text-left font-medium whitespace-nowrap">
                          {row.label}
                        </th>
                        <td className="px-3 py-2 text-right tabular-nums">{formatBDT(row.customerMinor)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {row.salonMinor < 0 ? `−${formatBDT(-row.salonMinor)}` : formatBDT(row.salonMinor)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">{formatBDT(row.platformMinor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </CardContent>
        </Card>

        <PolicyCard title="Fees" description="What the salon and the platform charge.">
          {field("commissionPercent", { note: NEW_ONLY })}
          {field("salonCancelCreditMinor", { note: NEW_ONLY })}
          {field("feeSalonSharePercent", { note: NEW_ONLY })}
          {field("travelFeeMaxMinor", { note: NEW_ONLY })}
        </PolicyCard>

        <PolicyCard title="Payment" description="What the customer pays up front.">
          {field("advancePercent", { note: NEW_ONLY })}
          {field("paymentWindowMinutes")}
          {field("minOrderMinMinor")}
          {field("minOrderMaxMinor")}
        </PolicyCard>

        <PolicyCard title="Booking window & slots" description="How far ahead, and how close to the visit, customers can book.">
          {field("bookingWindowDays")}
          {field("minLeadMinutes")}
          {field("slotStepMinutes")}
          {field("rescheduleCutoffHours")}
          {field("maxRescheduleCount")}
        </PolicyCard>

        <PolicyCard title="Area, hours & limits" description="The outer limits every branch's own settings stay inside.">
          {field("maxRadiusKm")}
          {field("dayStartBound")}
          {field("dayEndBound")}
          {field("ladiesLastStart")}
          {field("maxActivePerCustomer")}
          {field("noShowWaitMinutes")}
          {field("noShowBlockThreshold")}
          {field("noShowBlockDays")}
          {field("appealWindowHours")}
        </PolicyCard>

        <PolicyCard title="Switches" description="Turning a side off hides it at once and stops new bookings on it. Visits already booked go ahead.">
          {field("enabled")}
          {field("ladiesEnabled")}
          {field("gentsEnabled")}
          {field("requireApproval")}
        </PolicyCard>
      </form>

      <SaveBar
        show={edits.length > 0 || invalid}
        message={
          invalid ? "Fix the highlighted values" : `${edits.length} unsaved change${edits.length === 1 ? "" : "s"}`
        }
        form={formId}
        disabled={invalid || edits.length === 0}
        onDiscard={() => setDraft(initial())}
      />

      {confirming && (
        <ReasonDialog
          open
          onOpenChange={(next) => !next && setConfirming(null)}
          title={confirming === "fees" ? "Turn all fees off" : "Save Home Service changes"}
          description={
            <span className="block space-y-1">
              {pendingEdits.map(({ setting, value }) => (
                <span key={setting.key} className="block">
                  <span className="font-medium">{setting.label}:</span> {formatSettingValue(setting, setting.value)} →{" "}
                  {formatSettingValue(setting, value)}
                </span>
              ))}
              {pendingEdits.some((e) => e.setting.approval) && (
                <span className="block pt-1 text-warning">
                  Changes marked Needs approval wait for a second admin, each as its own request.
                </span>
              )}
            </span>
          }
          reasonCodes={SETTING_REASONS}
          confirmLabel={confirming === "fees" ? "Turn fees off" : "Save"}
          showNotify={false}
          stepUp={pendingEdits.some((e) => e.setting.tier === 3)}
          onConfirm={(input) => saveSettings(pendingEdits, reasonText(SETTING_REASONS, input))}
          onDone={(result) => {
            showResultToast(result);
            onSaved();
          }}
        />
      )}
    </>
  );
}

function PolicyCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="divide-y">{children}</CardContent>
    </Card>
  );
}

function FeesBanner({
  fees,
  canReset,
  nothingToReset,
  dirty,
  onReset,
}: {
  fees: string[];
  canReset: boolean;
  nothingToReset: boolean;
  dirty: boolean;
  onReset: () => void;
}) {
  const off = fees.length === 0;
  return (
    <section
      aria-label="Fees in force"
      className={cn(
        "space-y-3 rounded-2xl border p-4",
        off ? "border-success/30 bg-success-soft/60" : "border-warning/30 bg-warning-soft/60",
      )}
    >
      <div className="flex items-start gap-2 text-sm">
        {off ? (
          <BadgeCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-success" />
        ) : (
          <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-warning" />
        )}
        {off ? (
          <p className="font-medium">
            All Home Service fees are off — customers cancel free and are refunded automatically
          </p>
        ) : (
          <div className="min-w-0 space-y-1">
            <p className="font-medium">These fees are on:</p>
            <ul className="list-disc space-y-0.5 pl-4">
              {fees.map((fee) => (
                <li key={fee}>{fee}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {canReset && (
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" disabled={nothingToReset || dirty} onClick={onReset}>
            Turn all fees off
          </Button>
          {dirty && !nothingToReset && (
            <span className="text-xs text-muted-foreground">Save or discard your changes first.</span>
          )}
        </div>
      )}
    </section>
  );
}
