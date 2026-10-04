"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import { Camera, ImageUp, Loader2, ScanFace, Scissors, Sun, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createTryOnUpload } from "@/services/hairstyle/createTryOnUpload";
import { confirmTryOnUpload } from "@/services/hairstyle/confirmTryOnUpload";
import { uploadToCloudinary } from "@/services/hairstyle/uploadToCloudinary";
import { compressImage } from "./compressImage";
import { PrivacyNote } from "./PrivacyNote";
import { Turnstile } from "./Turnstile";
import type { TryOnSession } from "./TryOnPanel";

type Phase = "idle" | "preparing" | "uploading" | "checking";

const TIPS = [
  { icon: ScanFace, text: "Face the camera" },
  { icon: Sun, text: "Good, even light" },
  { icon: Scissors, text: "Hair visible, no hat" },
  { icon: User, text: "Just you in it" },
];

const STATUS: Record<Exclude<Phase, "idle">, string> = {
  preparing: "Preparing your photo…",
  uploading: "Uploading…",
  checking: "Checking your photo…",
};

export function PhotoStep({ onReady }: { onReady: (session: TryOnSession) => void }) {
  const [photo, setPhoto] = useState<{ blob: Blob; preview: string } | null>(null);
  const [consent, setConsent] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  // A Turnstile token works once; a new key renders a fresh widget.
  const [turnstileKey, setTurnstileKey] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const pickInput = useRef<HTMLInputElement>(null);
  const selfieInput = useRef<HTMLInputElement>(null);

  const busy = phase !== "idle";

  useEffect(() => {
    const preview = photo?.preview;
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [photo]);

  const choose = async (file: File | undefined) => {
    if (!file || busy) return;
    setError(null);
    setPhase("preparing");
    const result = await compressImage(file);
    setPhase("idle");
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setPhoto({ blob: result.blob, preview: URL.createObjectURL(result.blob) });
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    void choose(e.dataTransfer.files?.[0]);
  };

  const upload = async () => {
    if (!photo || !consent || !token || busy) return;
    setError(null);
    setProgress(0);

    const fail = (message: string) => {
      setError(message);
      setPhase("idle");
      setToken(null);
      setTurnstileKey((k) => k + 1);
    };

    setPhase("uploading");
    const ticket = await createTryOnUpload(token);
    if (!ticket.success || !ticket.data) return fail(ticket.message);
    const { uploadId, ownerToken } = ticket.data;

    const sent = await uploadToCloudinary(photo.blob, ticket.data, setProgress);
    if (!sent.success || !sent.data) return fail(sent.message);

    setPhase("checking");
    // A 422 here says why the photo can't be used ("no face found", …).
    const confirmed = await confirmTryOnUpload(uploadId, ownerToken, sent.data);
    if (!confirmed.success || !confirmed.data) return fail(confirmed.message);

    setPhase("idle");
    onReady({ uploadId, ownerToken, beforeUrl: confirmed.data.beforeUrl });
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          "flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border bg-surface-subtle px-4 py-6 text-center transition-colors",
          dragOver && "border-primary bg-primary-soft",
        )}
      >
        {photo ? (
          <div
            role="img"
            aria-label="Your chosen photo"
            className="aspect-[4/5] w-36 rounded-xl bg-muted bg-cover bg-center shadow-md ring-4 ring-surface"
            style={{ backgroundImage: `url(${photo.preview})` }}
          />
        ) : (
          <span className="grid size-14 place-items-center rounded-full bg-primary-soft text-primary-hover">
            <ImageUp className="size-6" aria-hidden />
          </span>
        )}
        <div>
          <p className="text-sm font-semibold text-foreground">
            {photo ? "Looking good" : "Drop your photo here"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {photo ? "Continue below, or pick another photo." : "JPG or PNG, up to 15 MB"}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-center">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={() => pickInput.current?.click()}
          >
            <ImageUp aria-hidden /> {photo ? "Choose another" : "Choose a photo"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={() => selfieInput.current?.click()}
          >
            <Camera aria-hidden /> Take a selfie
          </Button>
        </div>
        <input
          ref={pickInput}
          type="file"
          accept="image/*"
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            void choose(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <input
          ref={selfieInput}
          type="file"
          accept="image/*"
          capture="user"
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            void choose(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>

      <ul aria-label="Tips for a good result" className="grid grid-cols-2 gap-2">
        {TIPS.map((tip) => (
          <li
            key={tip.text}
            className="flex items-center gap-2 rounded-xl bg-surface-subtle px-2.5 py-2 text-xs text-foreground"
          >
            <tip.icon className="size-4 shrink-0 text-primary-hover" aria-hidden />
            {tip.text}
          </li>
        ))}
      </ul>

      <label className="flex items-start gap-2.5 text-sm text-foreground">
        <input
          type="checkbox"
          required
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-primary"
        />
        <span>
          I&apos;m 16 or older, this is a photo of me (or I have permission), and I agree
          to <PrivacyNote>how it is processed</PrivacyNote>.
        </span>
      </label>

      <Turnstile key={turnstileKey} onToken={setToken} />

      <div aria-live="polite" className="space-y-2">
        {busy && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            {STATUS[phase]}
            {phase === "uploading" && progress > 0 && ` ${progress}%`}
          </p>
        )}
        {phase === "uploading" && (
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        {error && (
          <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>
        )}
      </div>

      <Button
        type="button"
        className="w-full"
        disabled={!photo || !consent || !token || busy}
        onClick={upload}
      >
        {busy ? <Loader2 className="animate-spin" aria-hidden /> : null}
        Continue
      </Button>
    </div>
  );
}
