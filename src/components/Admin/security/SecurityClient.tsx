"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ShieldCheck, ShieldAlert, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import TotpCodeInput from "@/components/Auth/TotpCodeInput";
import { useStepUp } from "@/components/Admin/StepUpDialog";
import { setupMfa } from "@/services/admin/mfa/setupMfa";
import { activateMfa } from "@/services/admin/mfa/activateMfa";
import { regenerateRecoveryCodes } from "@/services/admin/mfa/regenerateRecoveryCodes";
import type { AdminMfaState, MfaSetup } from "@/services/admin/types";
import { RecoveryCodesCard } from "./RecoveryCodesCard";

const dateFmt = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" });

/**
 * Enrolment (QR + manual key → first code → recovery codes, shown once) for
 * an account without 2FA, and the recovery-code tools for one with it.
 */
export function SecurityClient({
  mfa,
  email,
}: {
  mfa: AdminMfaState;
  email: string | null;
}) {
  const router = useRouter();
  const [enrolled, setEnrolled] = useState(mfa.enrolled);
  const [setup, setSetup] = useState<MfaSetup | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [codes, setCodes] = useState<string[] | null>(null);
  const [codesLeft, setCodesLeft] = useState(mfa.recoveryCodesLeft);
  const [isPending, startTransition] = useTransition();
  const { run, dialog } = useStepUp();

  const start = () =>
    startTransition(async () => {
      const result = await setupMfa();
      if (result.success && result.data) {
        setSetup(result.data);
        setCode("");
        setError(null);
      } else {
        toast.error(result.message || "Couldn't start two-factor setup.");
      }
    });

  const activate = (value: string) => {
    if (value.length !== 6) return;
    startTransition(async () => {
      const result = await activateMfa(value);
      setCode("");
      if (result.success && result.data) {
        setCodes(result.data.recoveryCodes);
        setCodesLeft(result.data.recoveryCodes.length);
        setEnrolled(true);
        setSetup(null);
        setError(null);
      } else {
        setError(result.message || "That code is not right.");
      }
    });
  };

  const regenerate = () =>
    startTransition(async () => {
      const result = await run(() => regenerateRecoveryCodes());
      if (result.success && result.data) {
        setCodes(result.data.recoveryCodes);
        setCodesLeft(result.data.recoveryCodes.length);
      } else if (result.errorCode !== "STEP_UP_REQUIRED") {
        toast.error(result.message || "Couldn't create new recovery codes.");
      }
    });

  // Fresh codes (after enrolment or a regenerate) take over the page until saved.
  if (codes) {
    const firstTime = !mfa.enrolled;
    return (
      <div className="space-y-4">
        {firstTime && (
          <StatusBanner ok title="Two-factor sign-in is on">
            From now on you&apos;ll enter a code from your authenticator app after your
            password.
          </StatusBanner>
        )}
        <RecoveryCodesCard
          codes={codes}
          doneLabel={firstTime ? "I've saved them, continue" : "I've saved them"}
          onDone={() => {
            setCodes(null);
            if (firstTime) router.push("/dashboard");
          }}
        />
      </div>
    );
  }

  if (enrolled) {
    return (
      <div className="space-y-4">
        <StatusBanner ok title="Two-factor sign-in is on">
          {mfa.enabledAt ? `Turned on ${dateFmt.format(new Date(mfa.enabledAt))}. ` : ""}
          You have {codesLeft} recovery {codesLeft === 1 ? "code" : "codes"} left.
        </StatusBanner>

        <section className="space-y-3 rounded-2xl border bg-surface p-5 sm:p-6">
          <h2 className="font-semibold">Recovery codes</h2>
          <p className="text-sm text-muted-foreground">
            Lost your codes, or used most of them? Make a new set. Every older code stops
            working, and you&apos;ll confirm with your authenticator app first.
          </p>
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            loading={isPending}
            onClick={regenerate}
          >
            Make new recovery codes
          </Button>
        </section>

        <p className="text-sm text-muted-foreground">
          Lost your phone and your recovery codes? Ask a super admin to reset two-factor
          sign-in for your account.
        </p>
        {dialog}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <StatusBanner title="Set up two-factor sign-in to continue">
        Admin and agent accounts need a second step at sign-in. The console stays locked
        until it&apos;s on.
      </StatusBanner>

      {!setup ? (
        <section className="space-y-4 rounded-2xl border bg-surface p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
            <p className="text-sm text-muted-foreground">
              You&apos;ll need an authenticator app on your phone, such as Google
              Authenticator, Microsoft Authenticator or 1Password.
            </p>
          </div>
          <Button
            type="button"
            className="rounded-full font-bold"
            loading={isPending}
            onClick={start}
          >
            Set up authenticator app
          </Button>
        </section>
      ) : (
        <section className="space-y-6 rounded-2xl border bg-surface p-5 sm:p-6">
          <div className="space-y-3">
            <h2 className="font-semibold">1. Scan this QR code</h2>
            <p className="text-sm text-muted-foreground">
              In your authenticator app, add an account and scan the code.
              {email ? (
                <>
                  {" "}
                  It appears as{" "}
                  <span className="font-medium text-foreground">SalonKhuji ({email})</span>.
                </>
              ) : null}
            </p>
            <div className="flex justify-center rounded-xl bg-white p-4 sm:justify-start">
              <Image
                src={setup.qrDataUrl}
                alt="QR code for your authenticator app"
                width={200}
                height={200}
                unoptimized
              />
            </div>
            <details className="text-sm">
              <summary className="cursor-pointer font-medium text-primary">
                Can&apos;t scan? Enter the key by hand
              </summary>
              <p className="mt-2 break-all rounded-xl bg-surface-subtle p-3 font-mono tracking-wider">
                {setup.manualKey}
              </p>
            </details>
          </div>

          <div className="space-y-3">
            <h2 className="font-semibold">
              <label htmlFor="enrol-code">2. Enter the 6-digit code it shows</label>
            </h2>
            <TotpCodeInput
              id="enrol-code"
              value={code}
              onChange={(v) => {
                setCode(v);
                if (error) setError(null);
              }}
              onComplete={activate}
              disabled={isPending}
              invalid={!!error}
              describedBy="enrol-feedback"
              autoFocus={false}
            />
            <p
              id="enrol-feedback"
              aria-live="polite"
              className="min-h-5 text-center text-sm font-medium text-destructive"
            >
              {error}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                className="rounded-full"
                disabled={isPending}
                onClick={start}
              >
                Show a new QR code
              </Button>
              <Button
                type="button"
                className="rounded-full font-bold"
                loading={isPending}
                disabled={code.length !== 6}
                onClick={() => activate(code)}
              >
                Turn on
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function StatusBanner({
  ok = false,
  title,
  children,
}: {
  ok?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  const Icon = ok ? ShieldCheck : ShieldAlert;
  return (
    <div
      className={
        ok
          ? "flex items-start gap-3 rounded-2xl border border-success/20 bg-success-soft p-4"
          : "flex items-start gap-3 rounded-2xl border border-warning/20 bg-warning-soft p-4"
      }
    >
      <Icon
        className={
          ok ? "mt-0.5 h-5 w-5 shrink-0 text-success" : "mt-0.5 h-5 w-5 shrink-0 text-warning"
        }
        aria-hidden
      />
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{children}</p>
      </div>
    </div>
  );
}
