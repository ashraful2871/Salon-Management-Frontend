"use client";

import { useEffect, useId, useState } from "react";
import { Loader2, X } from "lucide-react";

import { deleteAssistantChats } from "@/services/assistant/deleteAssistantChats";

/** Must match GUEST_TTL_DAYS / SIGNED_IN_TTL_DAYS in the API's
 *  assistant.constants.ts — this is the promise, that is the job keeping it. */
const GUEST_DAYS = 30;
const SIGNED_IN_DAYS = 90;

type DeleteState =
  | { kind: "idle" }
  | { kind: "confirm" }
  | { kind: "deleting" }
  | { kind: "done"; message: string }
  | { kind: "error"; message: string };

const linkClass =
  "cursor-pointer font-medium text-foreground underline underline-offset-2 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-sm disabled:opacity-50";

/**
 * The privacy line under the composer: always visible, one short paragraph, so
 * it never pushes the composer off a phone screen — the transcript above is
 * what gives way. "Learn more" opens the full notice *over* the transcript
 * rather than growing the footer. There is no `/privacy` page yet; when there
 * is, give it an `#assistant` section and link to it from the notice.
 */
const PrivacyFooter = ({
  llm,
  signedIn,
  disabled,
  onDeleted,
}: {
  llm: boolean;
  signedIn: boolean;
  disabled: boolean;
  /** The chat on screen was one of those deleted: start a fresh one. */
  onDeleted: () => void;
}) => {
  const noticeId = useId();
  const [open, setOpen] = useState(false);
  const [del, setDel] = useState<DeleteState>({ kind: "idle" });
  const days = signedIn ? SIGNED_IN_DAYS : GUEST_DAYS;

  // "Deleted" is news for a moment, not a permanent fixture of the footer.
  useEffect(() => {
    if (del.kind !== "done") return;
    const timer = setTimeout(() => setDel({ kind: "idle" }), 5000);
    return () => clearTimeout(timer);
  }, [del]);

  const handleDelete = async () => {
    setDel({ kind: "deleting" });
    const result = await deleteAssistantChats();
    if (!result.success) {
      setDel({ kind: "error", message: result.message });
      return;
    }
    const n = result.data?.deleted ?? 0;
    setDel({
      kind: "done",
      message: n === 1 ? "Your chat was deleted." : `Your ${n} chats were deleted.`,
    });
    onDeleted();
  };

  if (del.kind === "confirm" || del.kind === "deleting") {
    return (
      <div
        role="alertdialog"
        aria-label="Delete your chats"
        className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] leading-snug text-muted-foreground"
      >
        <span className="text-foreground">
          Delete every chat on your account? This cannot be undone. Your
          bookings are kept.
        </span>
        <span className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleDelete}
            disabled={del.kind === "deleting"}
            className={`${linkClass} text-destructive hover:text-destructive`}
          >
            {del.kind === "deleting" ? (
              <Loader2 className="inline h-3 w-3 animate-spin" aria-label="Deleting" />
            ) : (
              "Delete"
            )}
          </button>
          <button
            type="button"
            onClick={() => setDel({ kind: "idle" })}
            disabled={del.kind === "deleting"}
            className={linkClass}
          >
            Cancel
          </button>
        </span>
      </div>
    );
  }

  return (
    <>
      <p className="mt-2 text-center text-[11px] leading-snug text-muted-foreground">
        {del.kind === "done" || del.kind === "error" ? (
          <span role="status" className={del.kind === "error" ? "text-destructive" : "text-foreground"}>
            {del.message}{" "}
          </span>
        ) : null}
        AI-assisted booking. Your messages are processed
        {llm ? " by Google Gemini" : ""} to find salons and times. Chats are
        deleted after {days} days.{" "}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={noticeId}
          className={linkClass}
        >
          Learn more
        </button>
        {signedIn && (
          <>
            {" · "}Your chats ·{" "}
            <button
              type="button"
              onClick={() => setDel({ kind: "confirm" })}
              disabled={disabled}
              className={linkClass}
            >
              Delete
            </button>
          </>
        )}
      </p>

      {open && (
        <div
          id={noticeId}
          className="absolute inset-x-3 bottom-full z-10 mb-2 max-h-[min(60svh,420px)] overflow-y-auto rounded-xl border border-border bg-background p-4 text-left text-xs leading-relaxed text-muted-foreground shadow-xl"
        >
          <div className="mb-2 flex items-start justify-between gap-3">
            <h3 className="text-sm font-semibold text-foreground">
              Book with AI and your privacy
            </h3>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="-mr-1 -mt-1 grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-full hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <ul className="list-disc space-y-1.5 pl-4">
            <li>
              We process the buttons you tap and anything you type to find
              salons and free times. Your location is used only to show nearby
              salons, rounded to about 100 m.
            </li>
            {llm ? (
              <li>
                Typed messages are sent to Google Gemini to understand them.
                Taps never are. Nothing is booked unless you tap Confirm.
              </li>
            ) : (
              <li>
                Right now typed messages are read by our own rules, not an AI
                model. Nothing is booked unless you tap Confirm.
              </li>
            )}
            <li>
              Chats are deleted {GUEST_DAYS} days after your last message, or{" "}
              {SIGNED_IN_DAYS} days if you are signed in. Bookings you make are
              kept with your appointments, like any other booking.
            </li>
            <li>
              {signedIn
                ? "You can delete all your chats at any time with “Delete” below."
                : "Sign in to be able to delete your chats yourself; otherwise they expire on their own."}
            </li>
          </ul>
        </div>
      )}
    </>
  );
};

export default PrivacyFooter;
