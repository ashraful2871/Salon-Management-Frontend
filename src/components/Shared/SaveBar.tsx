"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * The save bar at the foot of a form card. It shows only while the form has
 * unsaved changes (or is saving), and sticks to the bottom of the screen above
 * the mobile tab bar, so Save stays in reach on a long form.
 */
export function SaveBar({
  show,
  pending = false,
  message = "Unsaved changes",
  saveLabel = "Save",
  form,
  onSave,
  onDiscard,
  disabled = false,
  className,
}: {
  show: boolean;
  pending?: boolean;
  message?: ReactNode;
  saveLabel?: string;
  /** The form's id: Save submits it. Without one, pass `onSave`. */
  form?: string;
  onSave?: () => void;
  /** Leave out when there is nothing to put back. */
  onDiscard?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  if (!show && !pending) return null;

  return (
    <div
      role="region"
      aria-label="Unsaved changes"
      className={cn(
        "sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-20 flex items-center gap-2 rounded-2xl border border-border bg-surface px-3 py-2.5 shadow-lg lg:bottom-4",
        className,
      )}
    >
      <p className="mr-auto min-w-0 text-sm font-medium" aria-live="polite">
        {message}
      </p>
      {onDiscard && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onDiscard}
          disabled={pending}
        >
          Discard
        </Button>
      )}
      <Button
        type={form ? "submit" : "button"}
        form={form}
        size="sm"
        onClick={form ? undefined : onSave}
        disabled={disabled}
        loading={pending}
      >
        {saveLabel}
      </Button>
    </div>
  );
}
