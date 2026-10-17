"use client";

import { useId, useState, useTransition } from "react";
import { format } from "date-fns";
import { EyeOff, Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ReportReviewButton } from "@/components/Salons/ReportReviewButton";
import { cn } from "@/lib/utils";
import { replyToReview } from "@/services/owner/replyToReview";
import type { OwnerReview } from "@/services/owner/review-types";

const MAX_REPLY = 1000;

const Stars = ({ rating }: { rating: number }) => (
  <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Star
        key={n}
        aria-hidden="true"
        className={cn("size-4", n <= rating ? "fill-gold text-gold" : "text-muted-foreground/40")}
      />
    ))}
  </span>
);

/**
 * One review with the business's public reply. Posting shows the reply at
 * once and rolls back if the server refuses; an edit is offered for 24 h.
 */
export function ReviewCard({ review, multiBranch }: { review: OwnerReview; multiBranch: boolean }) {
  const ids = useId();
  const [reply, setReply] = useState(review.ownerReply);
  const [repliedAt, setRepliedAt] = useState(review.ownerRepliedAt);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [isPending, startTransition] = useTransition();
  const hidden = review.status === "HIDDEN";
  const canEdit = !!reply && (review.canEditReply || (!review.ownerReply && !!repliedAt));

  const open = () => {
    setDraft(reply ?? "");
    setEditing(true);
  };

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    const edit = !!reply;
    const before = { reply, repliedAt };
    setReply(text);
    if (!edit) setRepliedAt(new Date().toISOString());
    setEditing(false);
    startTransition(async () => {
      const result = await replyToReview(review.id, text, edit);
      if (!result.success || !result.data) {
        setReply(before.reply);
        setRepliedAt(before.repliedAt);
        setDraft(text);
        setEditing(true);
        toast.error(result.message || "Couldn't save your reply.");
        return;
      }
      setRepliedAt(result.data.ownerRepliedAt);
      toast.success(edit ? "Reply updated" : "Reply posted");
    });
  };

  return (
    <li className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium">{review.customer.name}</p>
          <p className="text-xs text-muted-foreground">
            {[
              format(new Date(review.createdAt), "d MMM yyyy"),
              review.serviceName,
              review.staff?.name,
              multiBranch && review.salon.name,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <Stars rating={review.rating} />
      </div>

      {hidden ? (
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
          <EyeOff className="size-3.5" aria-hidden="true" />
          Hidden by moderators{review.hiddenReason ? ` — ${review.hiddenReason}` : ""}
        </p>
      ) : (
        review.comment && <p className="mt-3 text-sm leading-relaxed break-words">{review.comment}</p>
      )}

      {reply && !editing && (
        <div className={cn("mt-3 rounded-xl bg-surface-subtle px-3 py-2", isPending && "opacity-60")}>
          <p className="text-xs font-semibold">Your reply</p>
          <p className="text-sm text-muted-foreground break-words whitespace-pre-line">{reply}</p>
        </div>
      )}

      {editing && (
        <div className="mt-3 space-y-2">
          <label htmlFor={`${ids}-reply`} className="sr-only">
            Your public reply
          </label>
          <Textarea
            id={`${ids}-reply`}
            value={draft}
            maxLength={MAX_REPLY}
            rows={3}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Thank them, or explain what you'll do better. Everyone can read this."
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              {draft.length}/{MAX_REPLY} · {reply ? "Editable for 24 hours after posting" : "You can edit it for 24 hours"}
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={submit} disabled={!draft.trim() || isPending}>
                {isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
                {reply ? "Save" : "Post reply"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {!hidden && !editing && (
        <div className="mt-2 -ml-2 flex flex-wrap items-center gap-1">
          {!reply && (
            <Button variant="ghost" size="sm" onClick={open}>
              Reply
            </Button>
          )}
          {canEdit && (
            <Button variant="ghost" size="sm" onClick={open} disabled={isPending}>
              Edit reply
            </Button>
          )}
          <ReportReviewButton reviewId={review.id} />
        </div>
      )}
    </li>
  );
}
