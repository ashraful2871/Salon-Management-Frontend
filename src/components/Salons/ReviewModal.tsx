"use client";

import React, { useState } from "react";
import { ResponsiveDialog } from "@/components/Shared/ResponsiveDialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { createReview } from "@/services/review/createReview";
import { toast } from "sonner";

interface ReviewModalProps {
  open: boolean;
  onClose: () => void;
  appointmentId: string;
  /** Lets the action refresh this salon's rating on the page behind the modal. */
  salonId?: string;
}

const ReviewModal = ({ open, onClose, appointmentId, salonId }: ReviewModalProps) => {
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating.");
      return;
    }

    setLoading(true);
    const res = await createReview({ appointmentId, rating, comment }, salonId);
    setLoading(false);

    if (res.success) {
      toast.success("Review submitted successfully!");
      setRating(0);
      setComment("");
      onClose();
    } else {
      toast.error(res.message || "Failed to submit review");
    }
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(val) => !val && onClose()}
      title="Rate your experience"
      description="How was your visit? Your review helps other customers choose."
      className="sm:max-w-md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Skip
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            Submit review
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex justify-center gap-1" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={rating === star}
              aria-label={`${star} star${star === 1 ? "" : "s"}`}
              onClick={() => setRating(star)}
              className="grid size-11 place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Star
                className={`h-8 w-8 ${
                  rating >= star ? "fill-gold text-gold" : "text-muted-foreground"
                }`}
              />
            </button>
          ))}
        </div>

        <Textarea
          placeholder="Tell us about your experience... (optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="resize-none"
          rows={4}
        />
      </div>
    </ResponsiveDialog>
  );
};

export default ReviewModal;
