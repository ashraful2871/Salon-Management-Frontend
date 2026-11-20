"use client";

import { Check, Gift, Loader2 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import type { ApiResponse } from "@/lib/api-types";
import { normalizeCode } from "@/lib/referral";
import { percentLabel } from "@/lib/referral-terms";
import { track } from "@/lib/track";
import { cn } from "@/lib/utils";
import { checkReferralCode } from "@/services/referral/checkReferralCode";
import type { InviteLookup } from "@/services/referral/types";

const DEBOUNCE_MS = 400;
/** The longest code the API accepts (its shape is 6–12 characters). */
const MAX_LENGTH = 12;
/** Below the shortest code a value is still being typed, not wrong. */
const MIN_LENGTH = 6;

const NOT_FOUND = "We couldn't find that code. Check it, or remove it to continue.";
const PAUSED = "Referral rewards are paused right now. Remove the code to continue.";

type Outcome =
  | { status: "valid"; firstName: string | null; percent: number }
  | { status: "invalid"; message: string }
  /** The check itself failed; the API checks again on submit. */
  | { status: "error" };

type CodeCheck = Outcome | { status: "idle" } | { status: "checking" };

const outcomeOf = (result: ApiResponse<InviteLookup>, fallbackPercent: number): Outcome => {
  if (!result.success) {
    return result.errorCode === "REFERRAL_CODE_INVALID"
      ? { status: "invalid", message: NOT_FOUND }
      : { status: "error" };
  }
  const lookup = result.data;
  if (!lookup) return { status: "error" };
  if (!lookup.programOn) return { status: "invalid", message: PAUSED };
  if (!lookup.valid) return { status: "invalid", message: NOT_FOUND };
  return { status: "valid", firstName: lookup.firstName, percent: lookup.terms?.percent ?? fallbackPercent };
};

/**
 * The register form's "Have a referral code?" field. Collapsed behind a link,
 * or open and prefilled when the page had a code (`?ref=` or the `sm_ref`
 * link cookie). Upper-cases as you type and checks the code 400 ms after the
 * last key, answering in a polite live region.
 *
 * Posts `referralCode`, plus `referralSource=link` while the value is still
 * the one the link brought (the API then files it as a link referral).
 * `onValidCode` hands a checked code up for the Google button. A refusal on
 * submit (`serverError`) shows here, focused, until the code is edited.
 */
export function ReferralCodeField({
  initialCode,
  fallbackPercent,
  serverError,
  disabled,
  onValidCode,
}: {
  initialCode?: string;
  /** The friend's percent from settings, if a lookup doesn't send one. */
  fallbackPercent: number;
  /** The API's message when it refused the code on submit, and the code it refused. */
  serverError?: { code: string; message: string } | null;
  disabled?: boolean;
  /** Keep it stable (`useCallback` or a state setter): it runs whenever the answer changes. */
  onValidCode?: (code: string | null, fromLink: boolean) => void;
}) {
  const id = useId();
  const inputId = `${id}-code`;
  const statusId = `${id}-status`;
  const inputRef = useRef<HTMLInputElement>(null);
  const tracked = useRef(new Set<string>());

  const [open, setOpen] = useState(!!initialCode);
  const [value, setValue] = useState(initialCode ?? "");
  const [blurred, setBlurred] = useState(false);
  /** The last answer from the API, for the code it was asked about. */
  const [answer, setAnswer] = useState<{ code: string; outcome: Outcome } | null>(null);

  const normalized = normalizeCode(value);
  const fromLink = !!initialCode && normalized !== null && normalized === normalizeCode(initialCode);
  const typedLength = value.replace(/[\s\-‐-―]+/g, "").length;

  // Ask the API about a value with a code's shape, 400 ms after the last key.
  useEffect(() => {
    if (!normalized) return;
    let live = true;
    const timer = setTimeout(async () => {
      const result = await checkReferralCode(normalized);
      if (live) setAnswer({ code: normalized, outcome: outcomeOf(result, fallbackPercent) });
    }, DEBOUNCE_MS);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [normalized, fallbackPercent]);

  const check: CodeCheck = !value.trim()
    ? { status: "idle" }
    : !normalized
      ? // Too short is still being typed until they leave the field; long enough but malformed is wrong.
        typedLength >= MIN_LENGTH || blurred
        ? { status: "invalid", message: NOT_FOUND }
        : { status: "idle" }
      : answer?.code === normalized
        ? answer.outcome
        : { status: "checking" };

  const refused = !!serverError && normalized !== null && normalizeCode(serverError.code) === normalized;
  const error = refused ? serverError.message : check.status === "invalid" ? check.message : null;
  const validCode = !refused && check.status === "valid" ? normalized : null;

  // One `referral_code_entered` per distinct code with a definite answer.
  useEffect(() => {
    if (check.status !== "valid" && check.status !== "invalid") return;
    const key = normalized ?? value.trim().toUpperCase();
    if (tracked.current.has(key)) return;
    tracked.current.add(key);
    track("referral_code_entered", check.status === "valid" ? "result:valid" : "result:invalid");
  }, [check.status, normalized, value]);

  // The Google button carries only a code that checked out.
  useEffect(() => {
    onValidCode?.(validCode, fromLink);
  }, [validCode, fromLink, onValidCode]);

  // A refusal on submit: put the cursor in the field.
  useEffect(() => {
    if (serverError) inputRef.current?.focus();
  }, [serverError]);

  if (!open) {
    return (
      <div className="md:col-span-2">
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            requestAnimationFrame(() => inputRef.current?.focus());
          }}
          disabled={disabled}
          className="inline-flex min-h-11 items-center gap-2 rounded-full text-sm font-semibold text-primary transition-colors hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        >
          <Gift aria-hidden="true" className="size-4" />
          Have a referral code?
        </button>
      </div>
    );
  }

  return (
    <div className="md:col-span-2">
      <div className="mb-2 flex items-center justify-between gap-3">
        <label htmlFor={inputId} className="block text-sm font-bold">
          Referral code
        </label>
        <button
          type="button"
          onClick={() => {
            setValue("");
            setOpen(false);
          }}
          disabled={disabled}
          className="-my-3 inline-flex min-h-11 items-center rounded-full px-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        >
          Remove
        </button>
      </div>
      <div className="relative">
        <Gift
          aria-hidden="true"
          className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          ref={inputRef}
          id={inputId}
          name="referralCode"
          type="text"
          autoComplete="off"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          maxLength={MAX_LENGTH}
          placeholder="e.g. RAHIM7KQ"
          value={value}
          onChange={(e) => {
            setValue(e.target.value.toUpperCase());
            setBlurred(false);
          }}
          onBlur={() => setBlurred(true)}
          aria-invalid={error ? true : undefined}
          aria-describedby={statusId}
          disabled={disabled}
          className={cn(
            "pl-11 pr-11 font-semibold tracking-[0.08em] placeholder:font-normal placeholder:tracking-normal",
            error && "border-destructive focus-visible:ring-destructive",
          )}
        />
        {check.status === "checking" && (
          <Loader2
            aria-hidden="true"
            className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground"
          />
        )}
      </div>
      {fromLink && <input type="hidden" name="referralSource" value="link" />}

      <div id={statusId} aria-live="polite" className="text-sm">
        {error ? (
          <p className="mt-2 font-medium text-danger">{error}</p>
        ) : check.status === "valid" ? (
          <p className="mt-2 inline-flex items-start gap-1.5 rounded-2xl bg-success-soft px-3 py-1.5 font-semibold text-success">
            <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>
              {check.firstName ? `${check.firstName}'s code` : "Code accepted"}: {percentLabel(check.percent)} off
              your first booking
            </span>
          </p>
        ) : check.status === "error" ? (
          <p className="mt-2 text-muted-foreground">
            We couldn&apos;t check this code right now. It&apos;s checked again when you create your account.
          </p>
        ) : null}
      </div>
    </div>
  );
}
