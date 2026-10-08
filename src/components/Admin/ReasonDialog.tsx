"use client";

import { useId, useState, useTransition, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ResponsiveDialog } from "@/components/Shared/ResponsiveDialog";
import type { ApiResponse } from "@/lib/api-types";
import { useStepUp } from "./StepUpDialog";

export type ReasonCode = { value: string; label: string };

export type ReasonInput = { reasonCode: string; note: string; notify: boolean };

/** The code that makes the note required. */
const OTHER = "OTHER";

/**
 * The confirm step for every admin action that needs a reason on the audit
 * log: optional `impact` (an `ImpactPreview`), a reason code, a note
 * (required for OTHER), and whether to email the person affected. With
 * `stepUp`, the action runs through `useStepUp`, so a `STEP_UP_REQUIRED`
 * answer asks for the 2FA code and retries once.
 *
 * Closes itself on success and hands the result to `onDone`; a failure stays
 * open with the API's message.
 */
export function ReasonDialog<T>({
  open,
  onOpenChange,
  title,
  description,
  impact,
  reasonCodes,
  confirmLabel = "Confirm",
  tone = "default",
  notifyLabel = "Email them about this",
  defaultNotify = true,
  showNotify = true,
  stepUp = false,
  onConfirm,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  impact?: ReactNode;
  reasonCodes: ReasonCode[];
  confirmLabel?: string;
  tone?: "default" | "danger";
  notifyLabel?: string;
  defaultNotify?: boolean;
  showNotify?: boolean;
  stepUp?: boolean;
  onConfirm: (input: ReasonInput) => Promise<ApiResponse<T>>;
  onDone?: (result: ApiResponse<T>) => void;
}) {
  const ids = useId();
  const [reasonCode, setReasonCode] = useState("");
  const [note, setNote] = useState("");
  const [notify, setNotify] = useState(defaultNotify);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { run, dialog } = useStepUp();

  const noteRequired = reasonCode === OTHER;
  const ready = !!reasonCode && (!noteRequired || note.trim().length > 0);

  const reset = () => {
    setReasonCode("");
    setNote("");
    setNotify(defaultNotify);
    setError(null);
  };

  const close = (next: boolean) => {
    if (pending) return;
    if (!next) reset();
    onOpenChange(next);
  };

  const submit = () => {
    if (!ready) return;
    setError(null);
    startTransition(async () => {
      const input = { reasonCode, note: note.trim(), notify: showNotify && notify };
      const result = stepUp ? await run(() => onConfirm(input)) : await onConfirm(input);
      if (!result.success) {
        setError(result.message);
        return;
      }
      reset();
      onOpenChange(false);
      onDone?.(result);
    });
  };

  return (
    <>
      <ResponsiveDialog
        open={open}
        onOpenChange={close}
        title={title}
        description={description}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => close(false)} disabled={pending}>
              Cancel
            </Button>
            <Button
              type="button"
              variant={tone === "danger" ? "destructive" : "default"}
              className={tone === "danger" ? "text-white" : undefined}
              onClick={submit}
              disabled={!ready || pending}
            >
              {pending && <Loader2 aria-hidden="true" className="animate-spin" />}
              {confirmLabel}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {impact}
          <div className="space-y-1.5">
            <Label htmlFor={`${ids}-code`}>Reason</Label>
            <Select value={reasonCode} onValueChange={setReasonCode}>
              <SelectTrigger id={`${ids}-code`} className="w-full">
                <SelectValue placeholder="Choose a reason" />
              </SelectTrigger>
              <SelectContent>
                {reasonCodes.map((code) => (
                  <SelectItem key={code.value} value={code.value}>
                    {code.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${ids}-note`}>
              Note{" "}
              <span className="font-normal text-muted-foreground">
                {noteRequired ? "(required)" : "(optional)"}
              </span>
            </Label>
            <Textarea
              id={`${ids}-note`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={1000}
              rows={3}
              aria-required={noteRequired}
              placeholder="Kept on the audit log"
            />
          </div>
          {showNotify && (
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 accent-primary"
                checked={notify}
                onChange={(e) => setNotify(e.target.checked)}
              />
              {notifyLabel}
            </label>
          )}
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
