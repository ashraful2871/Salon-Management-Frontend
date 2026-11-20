"use client";

import Link from "next/link";
import { Check, Copy, Gift } from "lucide-react";

import { Button } from "@/components/ui/button";
import { percentLabel } from "@/lib/referral-terms";
import { track } from "@/lib/track";
import { cn } from "@/lib/utils";
import { ShareLink } from "./ShareButtons";
import { useCopy } from "./useCopy";

/** What the card needs; `inviteCardFor` (lib/referral-invite.ts) builds it on the server. */
export type InviteCardData = {
  link: string;
  /** The share text, already filled in. */
  message: string;
  friendPercent: number;
  youPercent: number;
};

/**
 * "Enjoyed booking?": the invite on a booking confirmation, with Copy link and
 * WhatsApp. Shown only to a customer while the program is on.
 */
export function InviteCard({ link, message, friendPercent, youPercent, className }: InviteCardData & { className?: string }) {
  const { copy, copied, announcement } = useCopy<"link">();

  const copyLink = async () => {
    if (await copy("link", link)) track("referral_share", "channel:copy_link");
  };

  return (
    <section
      aria-labelledby="invite-card-title"
      className={cn("rounded-3xl border border-gold/30 bg-cream p-5 sm:p-6", className)}
    >
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
          <Gift aria-hidden="true" className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 id="invite-card-title" className="font-display text-lg font-semibold text-foreground">
            Enjoyed booking?
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Give friends {percentLabel(friendPercent)} off and get {percentLabel(youPercent)}.{" "}
            <Link
              href="/dashboard/referrals"
              className="font-semibold text-primary underline-offset-4 hover:text-primary-hover hover:underline"
            >
              How it works
            </Link>
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <ShareLink channel="whatsapp" message={message} link={link} />
        <Button type="button" size="lg" variant="secondary" onClick={copyLink}>
          {copied === "link" ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          Copy link
        </Button>
      </div>
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </section>
  );
}
