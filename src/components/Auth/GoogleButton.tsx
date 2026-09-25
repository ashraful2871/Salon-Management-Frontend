"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState, type MouseEvent } from "react";

/**
 * "Continue with Google", in Google's own branding (white, `#dadce0` border,
 * the four-colour G).
 *
 * A plain `<a>`, never `next/link`: `Link` prefetches, and a prefetch of the
 * start route would begin an OAuth flow in the background. The first click
 * marks it busy and later clicks are swallowed, so a double click cannot start
 * two flows. Coming back from Google with the Back button can restore this
 * page from the back/forward cache still busy, so `pageshow` resets it.
 */
const GoogleButton = ({
  redirect,
  label = "Continue with Google",
}: {
  redirect?: string;
  label?: "Continue with Google";
}) => {
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const reset = (e: PageTransitionEvent) => {
      if (e.persisted) setBusy(false);
    };
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  const href = redirect
    ? `/api/auth/google/start?redirect=${encodeURIComponent(redirect)}`
    : "/api/auth/google/start";

  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (busy) {
      e.preventDefault();
      return;
    }
    setBusy(true);
  };

  return (
    <a
      href={href}
      onClick={onClick}
      aria-busy={busy}
      aria-disabled={busy}
      className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-[#dadce0] bg-white px-4 text-sm font-medium text-[#3c4043] shadow-sm transition-colors hover:bg-[#f8f9fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285f4]/40 aria-disabled:cursor-wait aria-disabled:opacity-80"
      style={{ fontFamily: "Roboto, system-ui, -apple-system, 'Segoe UI', Arial, sans-serif" }}
    >
      {busy ? (
        <Loader2 className="h-[18px] w-[18px] animate-spin text-[#5f6368]" aria-hidden />
      ) : (
        <GoogleLogo size={18} />
      )}
      <span>{label}</span>
    </a>
  );
};

/** Google's four-colour "G", as their branding guidelines draw it. */
export const GoogleLogo = ({ size }: { size: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 48 48"
    width={size}
    height={size}
    aria-hidden
  >
    <path
      fill="#EA4335"
      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
    />
    <path
      fill="#4285F4"
      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
    />
    <path
      fill="#FBBC05"
      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
    />
    <path
      fill="#34A853"
      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
    />
  </svg>
);

/** The "or" rule between the Google button and the email form. */
export const OrDivider = () => (
  <div className="my-6 flex items-center gap-3" role="separator">
    <div className="h-px flex-1 bg-slate-200" />
    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
      or
    </span>
    <div className="h-px flex-1 bg-slate-200" />
  </div>
);

export default GoogleButton;
