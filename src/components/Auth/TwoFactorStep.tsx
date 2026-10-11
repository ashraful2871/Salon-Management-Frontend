"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { ShieldCheck, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { verifyTwoFactor } from "@/services/auth/verifyTwoFactor";
import TotpCodeInput from "./TotpCodeInput";

/**
 * The second step of an admin or agent sign-in: a 6-digit code from the
 * authenticator app, or one recovery code. The ticket is in the `sm_2fa`
 * cookie, so this form carries only what the person types.
 */
export default function TwoFactorStep({ onBack }: { onBack?: () => void }) {
  const [state, formAction, isPending] = useActionState(verifyTwoFactor, null);
  const [mode, setMode] = useState<"code" | "recovery">("code");
  const [code, setCode] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const failed = state && !state.success ? state : null;
  const expired = failed?.errorCode === "TICKET_EXPIRED";

  // A wrong code clears the boxes for the next try (once per answer).
  const [seen, setSeen] = useState(state);
  if (state !== seen) {
    setSeen(state);
    if (failed && !expired) setCode("");
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-2xl border bg-surface-subtle p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
        <p className="text-sm text-muted-foreground">
          {mode === "code"
            ? "Open your authenticator app and enter the 6-digit code for SalonKhuji."
            : "Enter one of the recovery codes you saved when you set up two-factor sign-in. Each code works once."}
        </p>
      </div>

      <form ref={formRef} action={formAction} className="space-y-5">
        {mode === "code" ? (
          <div>
            <label htmlFor="tf-code" className="mb-2 block text-sm font-bold">
              Authentication code
            </label>
            <input type="hidden" name="code" value={code} />
            <TotpCodeInput
              id="tf-code"
              value={code}
              onChange={setCode}
              onComplete={() => formRef.current?.requestSubmit()}
              disabled={isPending || expired}
              invalid={!!failed}
              describedBy="tf-feedback"
            />
          </div>
        ) : (
          <div>
            <label htmlFor="tf-recovery" className="mb-2 block text-sm font-bold">
              Recovery code
            </label>
            <Input
              id="tf-recovery"
              name="recoveryCode"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder="ABCDE-FGHJK"
              className="font-mono tracking-wider"
              disabled={isPending || expired}
              aria-invalid={failed ? true : undefined}
              aria-describedby="tf-feedback"
              autoFocus
              required
            />
          </div>
        )}

        <div id="tf-feedback" aria-live="polite" aria-atomic="true">
          {failed && (
            <div className="flex gap-3 rounded-2xl border border-destructive/20 bg-destructive/10 p-4">
              <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden />
              <p className="text-sm font-medium text-destructive">{failed.message}</p>
            </div>
          )}
        </div>

        {expired ? (
          onBack ? (
            <Button type="button" className="w-full rounded-full font-bold" onClick={onBack}>
              Sign in again
            </Button>
          ) : (
            <Button asChild className="w-full rounded-full font-bold">
              <Link href="/login">Sign in again</Link>
            </Button>
          )
        ) : (
          <Button
            type="submit"
            loading={isPending}
            disabled={mode === "code" && code.length !== 6}
            className="w-full rounded-full font-bold"
          >
            Verify and sign in
          </Button>
        )}
      </form>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <button
          type="button"
          className="font-semibold text-primary hover:text-primary-hover"
          onClick={() => {
            setMode(mode === "code" ? "recovery" : "code");
            setCode("");
          }}
        >
          {mode === "code" ? "Use a recovery code" : "Use the authenticator app"}
        </button>
        {onBack ? (
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground"
            onClick={onBack}
          >
            Back
          </button>
        ) : (
          <Link href="/login" className="text-muted-foreground hover:text-foreground">
            Back to sign in
          </Link>
        )}
      </div>
    </div>
  );
}
