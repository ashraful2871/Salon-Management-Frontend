"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Eye, Loader2 } from "lucide-react";
import { endImpersonation } from "@/services/admin/impersonation/endImpersonation";

const mmss = (ms: number) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};

/**
 * Fixed at the top in the danger tone. `--imp-offset` moves the fixed navbar,
 * the dashboard header and sidebar down by the bar's height. At 0:00 the view
 * ends by itself (the API refuses the token from then on anyway).
 */
export function ImpersonationBannerClient({ name, until }: { name: string; until: number }) {
  const [left, setLeft] = useState(() => until - Date.now());
  const [pending, startTransition] = useTransition();
  const ended = useRef(false);

  const end = () => {
    if (ended.current) return;
    ended.current = true;
    startTransition(() => endImpersonation());
  };

  useEffect(() => {
    const tick = () => {
      const remaining = until - Date.now();
      setLeft(remaining);
      if (remaining <= 0) end();
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [until]);

  return (
    <>
      <style>{":root{--imp-offset:2.5rem}"}</style>
      <div
        role="status"
        className="fixed inset-x-0 top-0 z-[80] flex h-10 items-center justify-center gap-2 bg-danger px-4 text-sm font-medium text-white shadow-md"
      >
        <Eye className="h-4 w-4 shrink-0" aria-hidden />
        <p className="min-w-0 truncate">
          Viewing as <span className="font-semibold">{name}</span>
          <span className="hidden sm:inline"> · read-only</span> ·{" "}
          <span className="tabular-nums" aria-label="time left">
            {mmss(left)}
          </span>{" "}
          left
        </p>
        <button
          type="button"
          onClick={end}
          disabled={pending}
          className="ml-1 inline-flex h-7 shrink-0 cursor-pointer items-center gap-1 rounded-full bg-white px-3 text-xs font-semibold text-danger hover:bg-white/90 disabled:opacity-70"
        >
          {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
          End
        </button>
      </div>
    </>
  );
}
