"use client";

import { useRef, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";

/**
 * A centred dialog from `md` up and a bottom sheet on phones, with the same
 * content. The body scrolls; `footer` stays pinned under it (put the main
 * action last: it sits on the right on desktop and on top in the sheet).
 */
export function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  // Opened from a plain button (no DialogTrigger), Radix has nothing to hand
  // focus back to on close, so it would land on <body>. Remember what had
  // focus as it opens (before focus moves in) and return it there.
  const returnFocusTo = useRef<HTMLElement | null>(null);
  const rememberFocus = () => {
    const el = document.activeElement;
    returnFocusTo.current = el instanceof HTMLElement && el !== document.body ? el : null;
  };
  const restoreFocus = (event: Event) => {
    const el = returnFocusTo.current;
    returnFocusTo.current = null;
    if (el?.isConnected) {
      event.preventDefault();
      el.focus({ preventScroll: true });
    }
  };

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          onOpenAutoFocus={rememberFocus}
          onCloseAutoFocus={restoreFocus}
          className={cn(
            "flex max-h-[85dvh] flex-col gap-0 overflow-hidden rounded-2xl border-border bg-surface p-0 sm:max-w-lg",
            className,
          )}
        >
          <DialogHeader className="shrink-0 border-b border-border px-6 pt-6 pb-4 pr-12 text-left">
            <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
          {footer && (
            <div className="flex shrink-0 flex-row justify-end gap-2 border-t border-border px-6 py-4">
              {footer}
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        onOpenAutoFocus={rememberFocus}
        onCloseAutoFocus={restoreFocus}
        className={cn(
          "bg-surface data-[vaul-drawer-direction=bottom]:max-h-[90dvh] data-[vaul-drawer-direction=bottom]:rounded-t-2xl",
          className,
        )}
      >
        <DrawerHeader className="shrink-0 px-4 pt-3 pb-3 text-left group-data-[vaul-drawer-direction=bottom]/drawer-content:text-left">
          <DrawerTitle className="text-lg font-semibold">{title}</DrawerTitle>
          {description && <DrawerDescription>{description}</DrawerDescription>}
        </DrawerHeader>
        <div
          className={cn(
            "min-h-0 flex-1 overflow-y-auto px-4 pb-4",
            !footer && "pb-[max(1rem,env(safe-area-inset-bottom))]",
          )}
        >
          {children}
        </div>
        {footer && (
          <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-border px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] *:w-full">
            {footer}
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
