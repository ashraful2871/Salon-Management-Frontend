"use client";

import { useEffect, useState } from "react";
import { Info, Timer, TriangleAlert } from "lucide-react";

import { TONE_CLASSES } from "@/lib/status-tone";
import { cn } from "@/lib/utils";
import type { HomeCancelPolicy } from "@/services/home-service/types";

const TITLE: Record<HomeCancelPolicy, string> = {
  FREE: "Free cancellation",
  WINDOW: "Cancellation rule",
  NON_REFUNDABLE: "Non-refundable advance",
};

/**
 * The cancellation rule in the server's own words, toned by policy (warning
 * for WINDOW / NON_REFUNDABLE, info for FREE). With `onAcceptedChange` it
 * carries the "I understand" tick that Pay waits for; without, it is the
 * record of what was accepted.
 */
export function DisclaimerBox({
  policy,
  text,
  accepted,
  onAcceptedChange,
  acceptedAt,
  lang: langProp,
  onLangChange,
}: {
  policy: HomeCancelPolicy;
  /** Both languages (a quote) or the one stored on the booking. */
  text: { en: string; bn: string } | string;
  accepted?: boolean;
  onAcceptedChange?: (accepted: boolean) => void;
  acceptedAt?: string | null;
  /** Controlled language, so the one read is the one stored with the booking. */
  lang?: "en" | "bn";
  onLangChange?: (lang: "en" | "bn") => void;
}) {
  const [ownLang, setOwnLang] = useState<"en" | "bn">("en");
  const lang = langProp ?? ownLang;
  const setLang = (next: (l: "en" | "bn") => "en" | "bn") => {
    const value = next(lang);
    setOwnLang(value);
    onLangChange?.(value);
  };
  const tone = policy === "FREE" ? "info" : "warning";
  const Icon = policy === "FREE" ? Info : TriangleAlert;
  const body = typeof text === "string" ? text : text[lang] || text.en;

  return (
    <section
      aria-label="Cancellation rule"
      className={cn(
        "rounded-2xl border p-4",
        TONE_CLASSES[tone].soft,
        tone === "info" ? "border-info/30" : "border-warning/40",
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn("mt-0.5 size-5 shrink-0", TONE_CLASSES[tone].text)} aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-foreground">{TITLE[policy]}</h3>
            {typeof text !== "string" && text.bn && (
              <button
                type="button"
                onClick={() => setLang((l) => (l === "en" ? "bn" : "en"))}
                className="cursor-pointer rounded-full px-2 py-0.5 text-xs font-medium text-primary underline-offset-2 hover:underline"
              >
                {lang === "en" ? "বাংলায় পড়ুন" : "Read in English"}
              </button>
            )}
          </div>
          <p lang={lang === "bn" && typeof text !== "string" ? "bn" : undefined} className="mt-1 whitespace-pre-line text-sm leading-relaxed text-foreground/90">
            {body}
          </p>
          {onAcceptedChange && (
            <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-xl bg-surface/70 p-3 text-sm font-medium text-foreground">
              <input
                type="checkbox"
                checked={!!accepted}
                onChange={(e) => onAcceptedChange(e.target.checked)}
                className="mt-0.5 size-5 shrink-0 accent-primary"
              />
              I understand the cancellation rule
            </label>
          )}
          {acceptedAt && (
            <p className="mt-2 text-xs text-muted-foreground">
              Accepted{" "}
              {new Date(acceptedAt).toLocaleString("en-GB", {
                day: "numeric",
                month: "short",
                hour: "numeric",
                minute: "2-digit",
                timeZone: "Asia/Dhaka",
              })}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

/** mm:ss left until `until`; calls `onExpire` once at zero. */
export function PaymentCountdown({ until, onExpire }: { until: string; onExpire?: () => void }) {
  const end = new Date(until).getTime();
  const [left, setLeft] = useState(() => Math.max(0, end - Date.now()));

  useEffect(() => {
    const tick = () => {
      const ms = Math.max(0, end - Date.now());
      setLeft(ms);
      if (ms === 0) {
        clearInterval(id);
        onExpire?.();
      }
    };
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one timer per deadline
  }, [end]);

  const s = Math.ceil(left / 1000);
  const urgent = s <= 120;
  return (
    <p
      role="timer"
      aria-live="off"
      className={cn(
        "flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium",
        urgent ? TONE_CLASSES.danger.soft : TONE_CLASSES.warning.soft,
        urgent ? TONE_CLASSES.danger.text : TONE_CLASSES.warning.text,
      )}
    >
      <Timer className="size-4" aria-hidden />
      {s > 0 ? (
        <>
          Pay within <span className="tabular-nums">{Math.floor(s / 60)}:{String(s % 60).padStart(2, "0")}</span> to keep this time
        </>
      ) : (
        "The time to pay has run out"
      )}
    </p>
  );
}
