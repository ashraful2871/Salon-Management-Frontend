"use client";

import { Loader2, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

/**
 * "Are you sure?" before an action that can't be undone. Controlled: the
 * caller holds `open` and runs the action in `onConfirm`; the dialog closes
 * itself when the user confirms or backs out.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  pending = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Red confirm button and a warning icon. */
  destructive?: boolean;
  pending?: boolean;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl border-border bg-surface data-[size=default]:sm:max-w-md">
        <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-start sm:gap-4 sm:text-left">
          {destructive && (
            <span className="mx-auto grid size-11 shrink-0 place-items-center rounded-full bg-danger-soft text-danger sm:mx-0">
              <TriangleAlert aria-hidden="true" className="size-5" />
            </span>
          )}
          <div className="space-y-1.5">
            <AlertDialogTitle className="text-base font-semibold">
              {title}
            </AlertDialogTitle>
            {description && (
              <AlertDialogDescription className="leading-relaxed">
                {description}
              </AlertDialogDescription>
            )}
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            variant={destructive ? "destructive" : "default"}
            disabled={pending}
            onClick={onConfirm}
            className={cn(destructive && "text-white")}
          >
            {pending && <Loader2 aria-hidden="true" className="animate-spin" />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
