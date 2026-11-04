"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/Shared/ConfirmDialog";
import { startNavProgress } from "@/components/Shared/NavProgress";

type Target = { kind: "href"; href: string } | { kind: "back" };

/**
 * Warns before unsaved edits are lost. While `dirty`:
 * - closing the tab, reloading or leaving the site shows the browser's own
 *   "Leave site?" prompt (browsers don't allow custom text there);
 * - clicking a link to another page in the app (sidebar, breadcrumb, tab bar,
 *   any <Link>) opens a "Leave without saving?" dialog instead of navigating;
 * - the browser's Back button (or a back swipe) opens the same dialog.
 *
 * Back can't be cancelled, so the first edit pushes a duplicate history entry
 * for this same URL (a "guard" entry). Back then only steps off the guard -
 * same URL, nothing re-renders - and the dialog asks; staying puts the guard
 * back, leaving steps back past it. Once the page is clean again, stepping off
 * the guard quietly goes back one more, so Back behaves as usual.
 *
 * Render the returned `dialog`. Links are caught on `window` in the capture
 * phase, ahead of Next's <Link> handler and the NavProgress bar.
 */
export function useUnsavedChangesGuard(
  dirty: boolean,
  {
    title = "Leave without saving?",
    description = "You have unsaved changes on this page. If you leave now, they'll be lost.",
    /** Where "Leave" goes after Back when there is no earlier page (opened in a new tab). */
    fallbackHref = "/dashboard",
  }: { title?: string; description?: string; fallbackHref?: string } = {},
) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  // Kept apart from `open`, so the dialog's target stays while it fades out.
  const target = useRef<Target | null>(null);

  const dirtyRef = useRef(dirty);
  // True while the guard entry is the current history entry.
  const onGuard = useRef(false);
  // The next popstate is our own step back, not the user's.
  const skipNextPop = useRef(false);
  // "Leave" was chosen: stop guarding anything.
  const leaving = useRef(false);

  useEffect(() => {
    dirtyRef.current = dirty;
    // First unsaved edit: put the guard entry on top (same URL, same state).
    if (leaving.current) return;
    if (dirty && !onGuard.current) {
      window.history.pushState(window.history.state, "", window.location.href);
      onGuard.current = true;
    } else if (!dirty && onGuard.current) {
      // Saved or discarded: take the guard off, so one Back still leaves.
      onGuard.current = false;
      skipNextPop.current = true;
      window.history.back();
    }
  }, [dirty]);

  /* ---- Back / forward ---- */
  useEffect(() => {
    const onPopState = () => {
      if (leaving.current) return;
      if (skipNextPop.current) {
        skipNextPop.current = false;
        return;
      }
      if (!onGuard.current) return; // an ordinary move elsewhere in history
      onGuard.current = false; // we just stepped off the guard onto this page

      if (!dirtyRef.current) {
        // Saved since: the guard has done its job, finish the user's Back.
        skipNextPop.current = true;
        window.history.back();
        return;
      }

      // Stay put for now and ask.
      window.history.pushState(window.history.state, "", window.location.href);
      onGuard.current = true;
      target.current = { kind: "back" };
      setOpen(true);
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  /* ---- Tab close / reload, and in-app links ---- */
  useEffect(() => {
    if (!dirty) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (leaving.current) return;
      event.preventDefault();
      // Older browsers still need returnValue set to show the prompt.
      event.returnValue = "";
    };

    const onClick = (event: MouseEvent) => {
      // New-tab and modified clicks leave this page as it is.
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!(event.target instanceof Element)) return;
      const anchor = event.target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const url = new URL(anchor.href, window.location.href);
      // Another site: a full page load, which `beforeunload` already covers.
      if (url.origin !== window.location.origin) return;
      // Same page (or only the hash): nothing is lost.
      if (url.pathname + url.search === window.location.pathname + window.location.search) return;

      event.preventDefault();
      event.stopPropagation();
      target.current = { kind: "href", href: url.pathname + url.search + url.hash };
      setOpen(true);
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("click", onClick, true);
    };
  }, [dirty]);

  const leave = () => {
    const to = target.current;
    setOpen(false);
    if (!to) return;
    leaving.current = true;
    startNavProgress();

    if (to.kind === "href") {
      router.push(to.href);
      return;
    }

    // Back past the guard and this page. With no earlier page (a new tab),
    // history can't go there, so fall back to a sensible page.
    const before = window.location.href;
    window.history.go(onGuard.current ? -2 : -1);
    window.setTimeout(() => {
      if (window.location.href === before) router.replace(fallbackHref);
    }, 400);
  };

  const dialog = (
    <ConfirmDialog
      open={open}
      onOpenChange={setOpen}
      title={title}
      description={description}
      confirmLabel="Leave without saving"
      cancelLabel="Stay on this page"
      tone="danger"
      onConfirm={leave}
    />
  );

  return { dialog };
}
