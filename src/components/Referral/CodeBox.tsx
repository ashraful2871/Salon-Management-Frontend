"use client";

import { Check, Copy, Link2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { track } from "@/lib/track";
import { cn } from "@/lib/utils";
import { useCopy } from "./useCopy";

/** "https://site.com/r/RAHIMNEN" → "site.com/r/RAHIMNEN". */
const shortLink = (link: string) => link.replace(/^https?:\/\//, "");

/** On the charcoal hero: a light outline pill that keeps AA on the dark ground. */
const ON_DARK = "border-white/30 bg-white/10 text-cream hover:bg-white/20 hover:text-cream";

/**
 * The code and the link on the Refer page's hero, each with a Copy pill.
 * Copying toasts "Copied", announces it to screen readers and counts a
 * `referral_share` (`copy_code` / `copy_link`).
 */
export function CodeBox({ code, link, className }: { code: string; link: string; className?: string }) {
  const { copy, copied, announcement } = useCopy<"code" | "link">();

  const copyCode = async () => {
    if (await copy("code", code)) track("referral_share", "channel:copy_code");
  };
  const copyLink = async () => {
    if (await copy("link", link)) track("referral_share", "channel:copy_link");
  };

  return (
    <div className={cn("rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/15 sm:p-5", className)}>
      <p id="refer-code-label" className="text-xs font-semibold tracking-wider text-cream/80 uppercase">
        Your code
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <p
          aria-labelledby="refer-code-label"
          className="min-w-0 font-mono text-3xl font-bold tracking-[0.18em] text-cream [overflow-wrap:anywhere] sm:text-4xl"
        >
          {code}
        </p>
        <Button type="button" size="lg" onClick={copyCode} className="shrink-0">
          {copied === "code" ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          Copy code
        </Button>
      </div>

      <div className="mt-4 border-t border-white/15 pt-4">
        <p id="refer-link-label" className="text-xs font-semibold tracking-wider text-cream/80 uppercase">
          Your invite link
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <p
            aria-labelledby="refer-link-label"
            className="flex min-w-0 items-center gap-2 font-mono text-sm text-cream/90"
          >
            <Link2 aria-hidden="true" className="size-4 shrink-0 text-gold-light" />
            <span className="min-w-0 [overflow-wrap:anywhere]">{shortLink(link)}</span>
          </p>
          <Button type="button" size="lg" variant="outline" onClick={copyLink} className={cn("shrink-0", ON_DARK)}>
            {copied === "link" ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
            Copy link
          </Button>
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}
