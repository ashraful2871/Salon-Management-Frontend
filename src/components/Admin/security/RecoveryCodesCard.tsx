"use client";

import { useState } from "react";
import { Check, Copy, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Freshly issued recovery codes. They are shown this once - the API keeps
 * only their hashes - so the card says so and offers a copy button.
 */
export function RecoveryCodesCard({
  codes,
  onDone,
  doneLabel = "I've saved them",
}: {
  codes: string[];
  onDone: () => void;
  doneLabel?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(codes.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border bg-surface p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden />
        <div>
          <h2 className="font-semibold">Save your recovery codes</h2>
          <p className="text-sm text-muted-foreground">
            Each code signs you in once if you lose your phone. They won&apos;t be shown
            again - keep them somewhere safe, away from this device.
          </p>
        </div>
      </div>

      <ul className="grid grid-cols-1 gap-2 rounded-xl bg-surface-subtle p-4 font-mono text-sm tracking-wider sm:grid-cols-2">
        {codes.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="button" variant="outline" className="rounded-full" onClick={copy}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy"}
        </Button>
        <Button type="button" className="rounded-full font-bold sm:ml-auto" onClick={onDone}>
          {doneLabel}
        </Button>
      </div>
    </div>
  );
}
