"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * A transaction id is only useful to a customer if they can hand it over
 * without retyping it, so every place one is shown gets this button.
 */
export default function CopyButton({
  value,
  label = "Transaction ID",
  className,
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // The async clipboard needs a secure context, which a LAN or http test
      // build is not. Fall back to the selection copy every browser still takes.
      const field = document.createElement("textarea");
      field.value = value;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      const ok = document.execCommand("copy");
      field.remove();

      if (!ok) {
        toast.error(`Could not copy the ${label.toLowerCase()}`);
        return;
      }
    }

    setCopied(true);
    toast.success(`${label} copied`);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`Copy ${label.toLowerCase()}`}
      title={`Copy ${label.toLowerCase()}`}
      className={cn(
        "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-transparent text-muted-foreground transition-colors hover:border-border hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring print:hidden",
        className
      )}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-600" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}
