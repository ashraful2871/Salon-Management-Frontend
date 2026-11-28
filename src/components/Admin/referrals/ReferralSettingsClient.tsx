"use client";

import { useId, useRef, useState, type ReactNode, type RefObject } from "react";
import { CircleAlert, Clock, Lock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ReasonDialog } from "@/components/Admin/ReasonDialog";
import { formatSettingValue, SETTING_REASONS } from "@/components/Admin/settings/format";
import { saveSettings, type SettingEdit } from "@/components/Admin/settings/saveSettings";
import { fromDraft, fromTakaDraft, same, SettingField, toDraft, toTakaDraft } from "@/components/Admin/settings/SettingField";
import { reasonText } from "@/components/Admin/users/labels";
import { PageHeader } from "@/components/Shared/PageHeader";
import { SaveBar } from "@/components/Shared/SaveBar";
import { ToneBadge } from "@/components/Shared/ToneBadge";
import { showResultToast } from "@/components/Shared/showResultToast";
import { can } from "@/lib/admin-permissions";
import { formatBDT } from "@/lib/money";
import { applicability, fillShareMessage, scopeText, type BookingKind, type RewardTerms, type Scope } from "@/lib/referral";
import { daysLabel, percentLabel } from "@/lib/referral-terms";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";
import type { AdminSetting } from "@/services/admin/settings/types";

const P = "referral.";
/** Poisha keys, typed in taka. */
const MONEY = new Set([`${P}refereeMaxDiscountMinor`, `${P}referrerMaxDiscountMinor`, `${P}minOrderMinor`]);
/** The examples the preview prices (the brief's own numbers, not settings). */
const SALON_EXAMPLE_MINOR = 120_000;
const HOME_EXAMPLE_MINOR = 200_000;
/** A made-up code for the share preview. */
const SAMPLE_CODE = "RAHIM7QX";
/** The preview ignores time: a reward that never expires, priced "now". */
const FAR_FUTURE = "9999-12-31T00:00:00.000Z";
const PREVIEW_NOW = new Date(0);
const PLACEHOLDERS = ["{percent}", "{code}", "{link}", "{site}", "{cap}"] as const;

const SCOPES: { value: Scope; title: string; line: string }[] = [
  { value: "ALL", title: "Salons + Home", line: "Any salon booking or Home Service visit." },
  { value: "SALON", title: "Salons only", line: "Salon bookings; not Home Service." },
  { value: "HOME", title: "Home only", line: "Home Service visits; not salon bookings." },
];

const TRIGGERS = [
  {
    value: "FIRST_BOOKING_COMPLETED",
    title: "When the friend's first booking is completed (recommended)",
    line: "Pays out only for a real customer: a completed platform booking within the qualifying window.",
  },
  {
    value: "REFEREE_VERIFIED",
    title: "When the friend verifies their email",
    line: "Faster, but a referrer can earn for friends who never book.",
  },
];

type Draft = Record<string, unknown>;
type Parsed = { value: unknown } | { error: string };

export type PendingApproval = { key: string; summary: string; mine: boolean };

const draftOf = (s: AdminSetting, value: unknown) => (MONEY.has(s.key) ? toTakaDraft(value) : toDraft(s, value));
const parse = (s: AdminSetting, draft: unknown): Parsed => (MONEY.has(s.key) ? fromTakaDraft(s, draft) : fromDraft(s, draft));

/**
 * The referral program's rules, built like Fees & policy: each field shows its
 * source, bounds, last change, History and Restore. A sticky panel shows what
 * customers will see under the draft values. Saving goes through one reason
 * dialog (step-up for tier 3); four-eyes keys are queued for a second admin.
 */
export function ReferralSettingsClient({
  settings,
  permissions,
  pending,
}: {
  settings: AdminSetting[];
  permissions: string[];
  pending: PendingApproval[];
}) {
  // A save bumps `version`, which remounts with the server's values; a change
  // sent for approval bumps nothing, so this clears that draft too.
  const [saves, setSaves] = useState(0);
  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Program settings"
        description="Every rule of the refer-a-friend program. A change reaches new rewards within about a minute; a reward already issued keeps the terms it was issued with."
      />
      <SettingsForm
        key={`${saves}:${settings.map((s) => s.version).join(",")}`}
        settings={settings}
        permissions={permissions}
        pending={pending}
        onSaved={() => setSaves((n) => n + 1)}
      />
    </div>
  );
}

function SettingsForm({
  settings,
  permissions,
  pending,
  onSaved,
}: {
  settings: AdminSetting[];
  permissions: string[];
  pending: PendingApproval[];
  onSaved: () => void;
}) {
  const formId = useId();
  const messageRef = useRef<HTMLTextAreaElement | null>(null);
  const canPolicy = can(permissions, "referrals.policy");
  const byKey = new Map(settings.map((s) => [s.key, s]));
  const initial = (): Draft => Object.fromEntries(settings.map((s) => [s.key, draftOf(s, s.value)]));
  const [draft, setDraft] = useState<Draft>(initial);
  const [confirming, setConfirming] = useState(false);

  const set = (key: string, value: unknown) => setDraft((d) => ({ ...d, [key]: value }));
  const parsed = new Map<string, Parsed>(settings.map((s) => [s.key, parse(s, draft[s.key])]));
  const valueOf = <T,>(name: string): T => {
    const key = P + name;
    const p = parsed.get(key);
    return (p && "value" in p ? p.value : byKey.get(key)?.value) as T;
  };

  const changed = settings.filter((s) => !same(draft[s.key], draftOf(s, s.value)));
  const errorOf = (key: string) => {
    const p = parsed.get(key);
    return p && "error" in p && changed.some((s) => s.key === key) ? p.error : null;
  };
  const invalid = changed.some((s) => "error" in (parsed.get(s.key) as Parsed));
  const edits: SettingEdit[] = changed
    .filter((s) => !same(valueOf(s.key.slice(P.length)), s.value))
    .map((s) => ({ setting: s, value: valueOf(s.key.slice(P.length)) }));

  const waiting = (key: string) => pending.filter((p) => p.key === key);

  const field = (name: string, options: { note?: ReactNode; control?: "textarea" | "none" } = {}) => {
    const setting = byKey.get(P + name);
    if (!setting) return null;
    const money = MONEY.has(setting.key);
    const queued = waiting(setting.key);
    const note = (
      <>
        {options.note}
        {queued.length > 0 && (
          <span className="mt-1 flex flex-wrap gap-1.5">
            {queued.map((q, i) => (
              <ToneBadge key={i} status="PENDING" tone="warning">
                <Clock aria-hidden className="size-3" />
                {q.mine ? "Waiting for another admin" : "Change waiting for approval"}
              </ToneBadge>
            ))}
          </span>
        )}
      </>
    );
    return (
      <SettingField
        key={setting.key}
        setting={setting}
        draft={draft[setting.key]}
        error={errorOf(setting.key)}
        canEdit={permissions.includes(setting.permission)}
        onChange={(value) => set(setting.key, value)}
        control={money ? "taka" : options.control}
        note={options.note || queued.length ? note : undefined}
      />
    );
  };

  const radioCards = <T extends string>(
    name: string,
    legend: string,
    options: { value: T; title: string; line: string }[],
    columns = "md:grid-cols-3",
  ) => {
    const setting = byKey.get(P + name);
    if (!setting) return null;
    const disabled = !permissions.includes(setting.permission);
    const current = String(valueOf(name));
    return (
      <fieldset className={cn("grid gap-3", columns)}>
        <legend className="sr-only">{legend}</legend>
        {options.map((option) => {
          const checked = current === option.value;
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
                name={`${formId}-${name}`}
                value={option.value}
                checked={checked}
                disabled={disabled}
                onChange={() => set(setting.key, option.value)}
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
    );
  };

  const savedOn = (name: string) => Boolean(byKey.get(P + name)?.value);
  const turningOff = (["enabled", "redemptionsEnabled"] as const).filter((n) => savedOn(n) && !valueOf<boolean>(n));

  const insertPlaceholder = (token: string) => {
    const key = `${P}shareMessage`;
    const text = String(draft[key] ?? "");
    const el = messageRef.current;
    const start = el?.selectionStart ?? text.length;
    const end = el?.selectionEnd ?? text.length;
    set(key, `${text.slice(0, start)}${token}${text.slice(end)}`);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + token.length, start + token.length);
    });
  };

  return (
    <>
      {!canPolicy && (
        <p className="flex items-center gap-2 rounded-xl border border-border bg-surface p-3 text-sm text-muted-foreground">
          <Lock aria-hidden className="size-4 shrink-0" />
          You can view but not change these.
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <form
          id={formId}
          className="min-w-0 space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (edits.length && !invalid) setConfirming(true);
          }}
        >
          <SettingsCard title="Program" description="The two switches. They need flags.manage; others see them read-only.">
            {field("enabled")}
            {field("redemptionsEnabled")}
            {turningOff.length > 0 && (
              <p className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning-soft/60 p-3 text-sm">
                <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-warning" />
                {turningOff.includes("redemptionsEnabled")
                  ? "Checkout stops applying rewards. Bookings that already reserved one keep their discount."
                  : "No new codes attach and nothing new is issued. Issued rewards keep working until they expire."}
              </p>
            )}
          </SettingsCard>

          <SettingsCard title="Friend's reward" description="The welcome reward a new customer gets for joining with a code. It works on their first booking.">
            {field("refereePercent")}
            {field("refereeMaxDiscountMinor", { note: "0 means no cap." })}
            {field("refereeValidDays")}
            {field("refereeScope", { control: "none" })}
            <div className="pt-1 pb-4">{radioCards("refereeScope", "Friend's reward works on", SCOPES)}</div>
          </SettingsCard>

          <SettingsCard title="Your reward (the referrer)" description="What the customer who shared the code earns.">
            {field("referrerPercent")}
            {field("referrerMaxDiscountMinor", { note: "0 means no cap." })}
            {field("referrerValidDays")}
            {field("referrerScope", { control: "none" })}
            <div className="pt-1 pb-4">{radioCards("referrerScope", "Referrer reward works on", SCOPES)}</div>
            {field("referrerTrigger", { control: "none" })}
            <div className="pt-1">{radioCards("referrerTrigger", "When the referrer is rewarded", TRIGGERS, "md:grid-cols-2")}</div>
          </SettingsCard>

          <SettingsCard title="Rules & limits" description="What a booking must be to count, how often someone can earn, and how rewards behave on a cancel or a no-show.">
            {field("minOrderMinor", { note: "Applies to both rewards and to qualifying. 0 means no minimum." })}
            {field("qualifyWindowDays")}
            {field("maxRewardsPerMonth", { note: "0 means no limit." })}
            {field("maxRewardsLifetime", { note: "0 means no limit." })}
            {field("attributionDays")}
            {field("restoreOnCancel")}
            {field("restoreOnNoShow")}
            {field("holdFlagged")}
            {field("velocityPerDay")}
          </SettingsCard>

          <SettingsCard title="Share message" description="The text a customer shares. Placeholders are filled in for each person.">
            <ShareMessageField
              setting={byKey.get(`${P}shareMessage`)}
              draft={draft[`${P}shareMessage`]}
              error={errorOf(`${P}shareMessage`)}
              canEdit={!!byKey.get(`${P}shareMessage`) && permissions.includes(byKey.get(`${P}shareMessage`)!.permission)}
              onChange={(v) => set(`${P}shareMessage`, v)}
              onInsert={insertPlaceholder}
              textareaRef={messageRef}
              waiting={waiting(`${P}shareMessage`).length > 0}
            />
          </SettingsCard>
        </form>

        <aside aria-label="What customers see" className="min-w-0 xl:sticky xl:top-20 xl:self-start">
          <Preview valueOf={valueOf} />
        </aside>
      </div>

      <SaveBar
        show={edits.length > 0 || invalid}
        message={invalid ? "Fix the highlighted values" : `${edits.length} unsaved change${edits.length === 1 ? "" : "s"}`}
        form={formId}
        disabled={invalid || edits.length === 0}
        onDiscard={() => setDraft(initial())}
      />

      {confirming && (
        <ReasonDialog
          open
          onOpenChange={(next) => !next && setConfirming(false)}
          title="Save referral settings"
          description={
            <span className="block space-y-1">
              {edits.map(({ setting, value }) => (
                <span key={setting.key} className="block">
                  <span className="font-medium">{setting.label}:</span> {formatSettingValue(setting, setting.value)} →{" "}
                  {formatSettingValue(setting, value)}
                  {setting.approval && <span className="text-warning"> (needs approval)</span>}
                </span>
              ))}
              {edits.some((e) => e.setting.approval) && (
                <span className="block pt-1 text-warning">
                  Changes marked “needs approval” wait for a second admin, each as its own request.
                </span>
              )}
            </span>
          }
          reasonCodes={SETTING_REASONS}
          confirmLabel="Save"
          showNotify={false}
          stepUp={edits.some((e) => e.setting.tier === 3)}
          onConfirm={(input) => saveSettings(edits, reasonText(SETTING_REASONS, input))}
          onDone={(result) => {
            showResultToast(result);
            onSaved();
          }}
        />
      )}
    </>
  );
}

function SettingsCard({ title, description, children }: { title: string; description: string; children: ReactNode }) {
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

function ShareMessageField({
  setting,
  draft,
  error,
  canEdit,
  onChange,
  onInsert,
  textareaRef,
  waiting,
}: {
  setting: AdminSetting | undefined;
  draft: unknown;
  error: string | null;
  canEdit: boolean;
  onChange: (value: unknown) => void;
  onInsert: (token: string) => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  waiting: boolean;
}) {
  const id = useId();
  if (!setting) return null;
  const text = String(draft ?? "");
  return (
    <div className="space-y-3">
      <SettingField
        setting={setting}
        draft={draft}
        error={error}
        canEdit={canEdit}
        onChange={onChange}
        control="none"
        note={waiting ? "A change to this is waiting for approval." : undefined}
      />
      <label htmlFor={id} className="sr-only">
        {setting.label}
      </label>
      <textarea
        id={id}
        ref={textareaRef}
        rows={3}
        maxLength={280}
        value={text}
        onChange={(e) => onChange(e.target.value)}
        disabled={!canEdit}
        aria-invalid={!!error}
        className="w-full rounded-xl border border-input bg-surface px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60"
      />
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-muted-foreground">Insert:</span>
        {PLACEHOLDERS.map((token) => (
          <button
            key={token}
            type="button"
            disabled={!canEdit}
            onClick={() => onInsert(token)}
            className="min-h-8 pointer-coarse:min-h-11 rounded-full border border-border px-2.5 font-mono text-xs hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
          >
            {token}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground tabular-nums">{text.length} / 280</span>
      </div>
    </div>
  );
}

/** A reward's terms from the draft values, as the API would issue it today. */
const draftTerms = (
  valueOf: <T>(name: string) => T,
  side: "referee" | "referrer",
): RewardTerms => ({
  id: side,
  kind: side === "referee" ? "REFEREE_WELCOME" : "REFERRER_BONUS",
  percentBps: Math.round(Number(valueOf(`${side}Percent`)) * 100),
  maxDiscountMinor: Number(valueOf(`${side}MaxDiscountMinor`)),
  minOrderMinor: Number(valueOf("minOrderMinor")),
  scope: valueOf<Scope>(`${side}Scope`),
  firstBookingOnly: side === "referee",
  expiresAt: FAR_FUTURE,
});

const WHY_NOT: Record<string, string> = {
  SCOPE: "doesn't apply here",
  MIN_ORDER: "below the minimum order",
  TOO_SMALL: "less than ৳1, not applied",
  EXPIRED: "expired",
  FIRST_BOOKING_DONE: "first booking only",
};

function CheckoutLine({ terms, kind, baseMinor, label }: { terms: RewardTerms; kind: BookingKind; baseMinor: number; label: string }) {
  const a = applicability(terms, { kind, baseMinor, completedBookings: 0, now: PREVIEW_NOW });
  return (
    <div className="space-y-1 rounded-xl border border-border p-3 text-sm">
      <p className="font-medium">{label}</p>
      <dl className="space-y-0.5 tabular-nums">
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Services</dt>
          <dd>{formatBDT(baseMinor)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Welcome reward ({percentLabel(terms.percentBps / 100)})</dt>
          <dd className={a.ok ? "text-success" : "text-muted-foreground"}>{a.ok ? `−${formatBDT(a.discountMinor)}` : WHY_NOT[a.reason]}</dd>
        </div>
        {kind === "HOME" && (
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Travel fee</dt>
            <dd className="text-muted-foreground">+ as quoted, never discounted</dd>
          </div>
        )}
        <div className="flex justify-between gap-3 border-t border-border pt-1 font-semibold">
          <dt>{kind === "HOME" ? "Services after reward" : "Total"}</dt>
          <dd>{formatBDT(baseMinor - (a.ok ? a.discountMinor : 0))}</dd>
        </div>
      </dl>
    </div>
  );
}

/** "What customers see", from the draft values (lib/referral.ts mirrors the API's maths). */
function Preview({ valueOf }: { valueOf: <T>(name: string) => T }) {
  const friend = draftTerms(valueOf, "referee");
  const you = draftTerms(valueOf, "referrer");
  const link = `${SITE.url.replace(/\/$/, "")}/r/${SAMPLE_CODE}`;
  const message = fillShareMessage(String(valueOf("shareMessage") ?? ""), {
    percent: friend.percentBps / 100,
    code: SAMPLE_CODE,
    link,
    site: SITE.name,
    capMinor: friend.maxDiscountMinor,
  });
  const cap = (minor: number) => (minor > 0 ? ` (up to ${formatBDT(minor)})` : "");
  const trigger =
    valueOf<string>("referrerTrigger") === "REFEREE_VERIFIED"
      ? "when your friend verifies their email"
      : "when your friend completes their first booking";
  const on = valueOf<boolean>("enabled");

  return (
    <Card>
      <CardHeader>
        <CardTitle>What customers see</CardTitle>
        <CardDescription>Updates as you type, from the values above. The API decides every real discount.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!on && (
          <p className="rounded-xl border border-border bg-surface-subtle p-3 text-sm text-muted-foreground">
            The program is off: customers see “Referrals are paused”.
          </p>
        )}

        <section aria-labelledby="pv-invite" className="space-y-2">
          <h3 id="pv-invite" className="text-sm font-semibold">
            Invite card
          </h3>
          <div className="rounded-2xl border border-gold/30 bg-cream p-3 text-sm">
            Give friends {percentLabel(friend.percentBps / 100)} off and get {percentLabel(you.percentBps / 100)}.
          </div>
          <figure className="space-y-1">
            <figcaption className="text-xs text-muted-foreground">Shared on WhatsApp</figcaption>
            <div className="rounded-2xl bg-surface-subtle p-3">
              <p className="ml-auto max-w-[90%] rounded-xl rounded-tr-sm bg-success-soft px-3 py-2 text-sm whitespace-pre-wrap break-words text-foreground shadow-xs">
                {message || <span className="text-muted-foreground">Empty message</span>}
              </p>
            </div>
          </figure>
        </section>

        <section aria-labelledby="pv-checkout" className="space-y-2">
          <h3 id="pv-checkout" className="text-sm font-semibold">
            Checkout, friend&apos;s first booking
          </h3>
          <CheckoutLine terms={friend} kind="SALON" baseMinor={SALON_EXAMPLE_MINOR} label={`A ${formatBDT(SALON_EXAMPLE_MINOR)} salon booking`} />
          <CheckoutLine terms={friend} kind="HOME" baseMinor={HOME_EXAMPLE_MINOR} label={`A ${formatBDT(HOME_EXAMPLE_MINOR)} Home Service cart`} />
        </section>

        <section aria-labelledby="pv-you" className="space-y-1 text-sm">
          <h3 id="pv-you" className="font-semibold">
            The referrer&apos;s reward
          </h3>
          <p>
            You get {percentLabel(you.percentBps / 100)} off{cap(you.maxDiscountMinor)} on {scopeText(you.scope)} {trigger}. Use it
            within {daysLabel(Number(valueOf("referrerValidDays")))}.
          </p>
          <p className="text-muted-foreground">
            Your friend gets {percentLabel(friend.percentBps / 100)} off{cap(friend.maxDiscountMinor)} their first booking on{" "}
            {scopeText(friend.scope)}, within {daysLabel(Number(valueOf("refereeValidDays")))} of joining.
          </p>
        </section>
      </CardContent>
    </Card>
  );
}
