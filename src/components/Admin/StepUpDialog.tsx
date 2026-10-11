"use client";

import { useCallback, useRef, useState, useTransition, type ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import { ResponsiveDialog } from "@/components/Shared/ResponsiveDialog";
import { Button } from "@/components/ui/button";
import TotpCodeInput from "@/components/Auth/TotpCodeInput";
import type { ApiResponse } from "@/lib/api-types";
import { stepUp } from "@/services/admin/mfa/stepUp";

/**
 * Asks for a fresh authenticator code before a tier-3 action. A right code
 * opens the 10-minute step-up window on the API; `onDone(true)` then lets the
 * caller retry. Closing it is `onDone(false)`.
 */
export function StepUpDialog({
  open,
  onDone,
}: {
  open: boolean;
  onDone: (confirmed: boolean) => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = (value: string) => {
    if (value.length !== 6) return;
    startTransition(async () => {
      const result = await stepUp(value);
      if (result.success) {
        setCode("");
        setError(null);
        onDone(true);
      } else {
        setCode("");
        setError(result.message || "That code is not right.");
      }
    });
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !isPending) {
          setCode("");
          setError(null);
          onDone(false);
        }
      }}
      title="Confirm it's you"
      description="This action needs a fresh code from your authenticator app. You won't be asked again for 10 minutes."
      footer={
        <Button
          className="w-full rounded-full font-bold"
          loading={isPending}
          disabled={code.length !== 6}
          onClick={() => submit(code)}
        >
          Confirm
        </Button>
      }
    >
      <div className="space-y-4 py-2">
        <div className="flex justify-center text-primary">
          <ShieldCheck className="h-8 w-8" aria-hidden />
        </div>
        <TotpCodeInput
          id="step-up-code"
          value={code}
          onChange={(v) => {
            setCode(v);
            if (error) setError(null);
          }}
          onComplete={submit}
          disabled={isPending}
          invalid={!!error}
          describedBy="step-up-feedback"
        />
        <p
          id="step-up-feedback"
          aria-live="polite"
          className="min-h-5 text-center text-sm font-medium text-destructive"
        >
          {error}
        </p>
      </div>
    </ResponsiveDialog>
  );
}

/**
 * Wraps a Server Action that may answer `STEP_UP_REQUIRED`: on that answer it
 * opens the step-up dialog and, once a code is confirmed, retries the action
 * once. Render `dialog` somewhere in the component.
 *
 *   const { run, dialog } = useStepUp();
 *   const result = await run(() => runPayouts(input));
 */
export function useStepUp(): {
  run: <T>(action: () => Promise<ApiResponse<T>>) => Promise<ApiResponse<T>>;
  dialog: ReactNode;
} {
  const [open, setOpen] = useState(false);
  const waiting = useRef<((confirmed: boolean) => void) | null>(null);

  const run = useCallback(
    async <T,>(action: () => Promise<ApiResponse<T>>): Promise<ApiResponse<T>> => {
      const first = await action();
      if (first.success || first.errorCode !== "STEP_UP_REQUIRED") return first;

      const confirmed = await new Promise<boolean>((resolve) => {
        waiting.current = resolve;
        setOpen(true);
      });
      return confirmed ? action() : first;
    },
    [],
  );

  const onDone = useCallback((confirmed: boolean) => {
    setOpen(false);
    waiting.current?.(confirmed);
    waiting.current = null;
  }, []);

  return { run, dialog: <StepUpDialog open={open} onDone={onDone} /> };
}
