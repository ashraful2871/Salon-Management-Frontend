"use client";

import { useId, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { showResultToast } from "@/components/Shared/showResultToast";
import { formatBDT, toMinor } from "@/lib/money";
import { cn } from "@/lib/utils";
import { submitDailyClose } from "@/services/owner/dailyCloseActions";
import { differenceLabel, differenceTone } from "./close-format";

/**
 * Count the till: the desk types the cash in the drawer and sees short / over
 * at once. The server recomputes what was expected when the close is saved.
 */
export const DailyCloseForm = ({
  salonId,
  date,
  expectedCashMinor,
}: {
  salonId: string;
  date: string;
  expectedCashMinor: number;
}) => {
  const [counted, setCounted] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const countedId = useId();
  const noteId = useId();

  const countedTaka = Number(counted);
  const valid = counted.trim() !== "" && Number.isFinite(countedTaka) && countedTaka >= 0;
  const countedMinor = valid ? toMinor(countedTaka) : null;
  const differenceMinor = countedMinor === null ? null : countedMinor - expectedCashMinor;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (countedMinor === null) {
      setError("Enter the cash you counted.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await submitDailyClose({
        salonId,
        date,
        countedCashMinor: countedMinor,
        ...(note.trim() && { note: note.trim() }),
      });
      showResultToast(result, "Day closed", "Couldn't close the day");
      if (!result.success) setError(result.message);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={countedId}>Cash counted in the till (৳)</Label>
          <Input
            id={countedId}
            inputMode="decimal"
            type="number"
            min={0}
            step="0.01"
            value={counted}
            onChange={(e) => setCounted(e.target.value)}
            placeholder="0"
            className="text-lg tabular-nums"
            aria-describedby={`${countedId}-diff`}
          />
        </div>
        <div
          id={`${countedId}-diff`}
          aria-live="polite"
          className={cn(
            "flex flex-col justify-center rounded-xl px-4 py-3",
            differenceMinor === null ? "bg-surface-subtle" : differenceTone(differenceMinor).soft,
          )}
        >
          <span className="text-xs text-muted-foreground">Difference</span>
          <span
            className={cn(
              "text-2xl font-bold tabular-nums",
              differenceMinor === null ? "text-muted-foreground" : differenceTone(differenceMinor).text,
            )}
          >
            {differenceMinor === null ? "—" : formatBDT(differenceMinor)}
          </span>
          <span className="text-xs text-muted-foreground">
            {differenceMinor === null
              ? `Expected ${formatBDT(expectedCashMinor)}`
              : differenceLabel(differenceMinor)}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={noteId}>Note (optional)</Label>
        <Textarea
          id={noteId}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          rows={2}
          placeholder="e.g. ৳200 paid out for supplies"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending || !valid}>
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          Close the day
        </Button>
      </div>
    </form>
  );
};
