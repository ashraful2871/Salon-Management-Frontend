"use client";

import { useCallback, useState } from "react";
import { Check, Loader2, Scissors, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/Shared/ResponsiveDialog";
import { showResultToast } from "@/components/Shared/showResultToast";
import { cn } from "@/lib/utils";
import { deleteTryOnPhoto } from "@/services/hairstyle/deleteTryOnPhoto";
import { startTryOnJob } from "@/services/hairstyle/startTryOnJob";
import type { HairCatalog } from "@/services/hairstyle/types";
import { HairstyleArt } from "./HairstyleArt";
import { PhotoStep } from "./PhotoStep";
import { ResultStep } from "./ResultStep";
import { StyleStep } from "./StyleStep";

export type TryOnSession = { uploadId: string; ownerToken: string; beforeUrl: string };

export type CurrentJob = {
  jobId: string;
  styleId: string;
  colorId: string;
  /** Bumped on "Try again", which keeps the job's id. */
  attempt: number;
};

export type DoneJob = {
  styleId: string;
  colorId: string;
  beforeUrl: string;
  resultUrl: string;
  downloadUrl?: string;
};

type Step = "photo" | "style" | "result";

const STORAGE_KEY = "hair-tryon";

const jobKey = (styleId: string, colorId: string) => `${styleId}|${colorId}`;

// Photos are deleted 24 h after upload; stop offering one a little before that.
const SESSION_MAX_AGE_MS = 23 * 60 * 60 * 1000;

const readSession = (): TryOnSession | null => {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw
      ? (JSON.parse(raw) as Partial<TryOnSession> & { savedAt?: number })
      : null;
    if (!parsed?.uploadId || !parsed.ownerToken || !parsed.beforeUrl) return null;
    if (!parsed.savedAt || Date.now() - parsed.savedAt > SESSION_MAX_AGE_MS) {
      window.sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return {
      uploadId: parsed.uploadId,
      ownerToken: parsed.ownerToken,
      beforeUrl: parsed.beforeUrl,
    };
  } catch {
    return null;
  }
};

const writeSession = (session: TryOnSession | null) => {
  try {
    if (session) {
      window.sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...session, savedAt: Date.now() }),
      );
    } else window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Private mode or storage blocked: the tool still works for this visit.
  }
};

const DESCRIPTION: Record<Step, string> = {
  photo: "Upload a clear photo of your face to preview a new look.",
  style: "Choose a hairstyle and colour to try on your photo.",
  result: "Drag the handle to compare before and after.",
};

const STEPS: Array<{ id: Step; label: string }> = [
  { id: "photo", label: "Photo" },
  { id: "style", label: "Style" },
  { id: "result", label: "Result" },
];

function StepIndicator({ step }: { step: Step }) {
  const at = STEPS.findIndex((s) => s.id === step);
  return (
    <ol aria-label="Progress" className="mb-5 flex items-center gap-2">
      {STEPS.map((s, i) => {
        const done = i < at;
        const current = i === at;
        return (
          <li
            key={s.id}
            aria-current={current ? "step" : undefined}
            className={cn("flex items-center gap-2", i < STEPS.length - 1 && "flex-1")}
          >
            <span
              className={cn(
                "grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold tabular-nums",
                done && "bg-primary text-primary-foreground",
                current && "bg-primary text-primary-foreground ring-4 ring-primary-soft",
                !done && !current && "bg-muted text-muted-foreground",
              )}
            >
              {done ? <Check className="size-3.5" aria-hidden /> : i + 1}
            </span>
            <span
              className={cn(
                "text-sm",
                current ? "font-semibold text-foreground" : "text-muted-foreground",
              )}
            >
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <span
                aria-hidden
                className={cn("h-px flex-1", done ? "bg-primary" : "bg-border")}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function TryOnPanel({
  catalog,
  open,
  onOpenChange,
}: {
  catalog: HairCatalog;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  // The panel only renders in the browser (dialog content), so storage is there.
  const [session, setSession] = useState<TryOnSession | null>(() =>
    typeof window === "undefined" ? null : readSession(),
  );
  const [step, setStep] = useState<Step>(() => (session ? "style" : "photo"));
  const [styleId, setStyleId] = useState<string | null>(null);
  const [colorId, setColorId] = useState(
    () => catalog.colors.find((c) => c.id === "natural")?.id ?? catalog.colors[0]?.id ?? "natural",
  );
  const [current, setCurrent] = useState<CurrentJob | null>(null);
  const [done, setDone] = useState<Record<string, DoneJob>>({});
  const [viewing, setViewing] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [styleError, setStyleError] = useState<string | null>(null);

  const reset = () => {
    writeSession(null);
    setSession(null);
    setCurrent(null);
    setDone({});
    setViewing(null);
    setStyleError(null);
    setStep("photo");
  };

  const onPhotoReady = (next: TryOnSession) => {
    writeSession(next);
    setSession(next);
    setDone({});
    setViewing(null);
    setCurrent(null);
    setStyleError(null);
    setStep("style");
  };

  /** Starts (or re-posts) a job; returns the error message, or null. */
  const start = async (styleId: string, colorId: string, attempt: number) => {
    if (!session) return "This photo is no longer available.";
    setStarting(true);
    const result = await startTryOnJob(session.uploadId, session.ownerToken, styleId, colorId);
    setStarting(false);
    if (!result.success || !result.data) return result.message;
    setCurrent({ jobId: result.data.jobId, styleId, colorId, attempt });
    return null;
  };

  const generate = async () => {
    if (!styleId) return;
    setStyleError(null);
    const key = jobKey(styleId, colorId);
    // Already made this session: show it, no new call.
    if (done[key]) {
      setViewing(key);
      setStep("result");
      return;
    }
    setViewing(null);
    const error = await start(styleId, colorId, 0);
    if (error) setStyleError(error);
    else setStep("result");
  };

  const retry = async () => {
    if (!current) return;
    const error = await start(current.styleId, current.colorId, current.attempt + 1);
    if (error) showResultToast({ success: false, message: error });
  };

  const onDone = useCallback((job: DoneJob) => {
    const key = jobKey(job.styleId, job.colorId);
    setDone((prev) => ({ ...prev, [key]: job }));
    setViewing(key);
  }, []);

  const deletePhoto = async () => {
    if (!session) return reset();
    setDeleting(true);
    const result = await deleteTryOnPhoto(session.uploadId, session.ownerToken);
    setDeleting(false);
    showResultToast(result, "Your photo was deleted.");
    if (result.success) reset();
  };

  if (!catalog.enabled) {
    return (
      <ResponsiveDialog open={open} onOpenChange={onOpenChange} title="Try a new hairstyle">
        <p className="text-sm text-muted-foreground">
          The hairstyle try-on is resting for now. It&apos;s coming back soon.
        </p>
      </ResponsiveDialog>
    );
  }

  const shownStep: Step = session ? step : "photo";
  const picked = catalog.styles.find((s) => s.id === styleId);
  const pickedColor = catalog.colors.find((c) => c.id === colorId);

  const styleFooter = (
    <div className="w-full space-y-2.5">
      <div aria-live="polite">
        {styleError && (
          <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{styleError}</p>
        )}
      </div>
      <div className="flex w-full items-center gap-3">
        <span className="relative size-11 shrink-0 overflow-hidden rounded-xl border border-border bg-primary-soft">
          {picked ? (
            <HairstyleArt
              styleId={picked.id}
              group={picked.group}
              hair={pickedColor?.swatch}
              framing="thumb"
            />
          ) : (
            <Scissors className="absolute inset-0 m-auto size-5 text-primary" aria-hidden />
          )}
        </span>
        <div className="min-w-0 flex-1" aria-live="polite">
          <p className="truncate text-sm font-semibold text-foreground">
            {picked ? picked.name : "Pick a style"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {pickedColor && pickedColor.id !== "natural"
              ? `${pickedColor.name} colour`
              : "Your own colour"}
          </p>
        </div>
        <Button type="button" disabled={!styleId || starting} onClick={generate}>
          {starting ? <Loader2 className="animate-spin" aria-hidden /> : <Sparkles aria-hidden />}
          Generate
        </Button>
      </div>
    </div>
  );

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Try a new hairstyle"
      description={DESCRIPTION[shownStep]}
      className={shownStep === "photo" ? undefined : "sm:max-w-2xl"}
      footer={shownStep === "style" ? styleFooter : undefined}
    >
      <StepIndicator step={shownStep} />
      {step === "photo" || !session ? (
        <PhotoStep onReady={onPhotoReady} />
      ) : step === "style" ? (
        <StyleStep
          catalog={catalog}
          beforeUrl={session.beforeUrl}
          styleId={styleId}
          colorId={colorId}
          onStyle={setStyleId}
          onColor={setColorId}
          onChangePhoto={reset}
        />
      ) : (
        <ResultStep
          catalog={catalog}
          ownerToken={session.ownerToken}
          current={current}
          done={done}
          viewing={viewing}
          onDone={onDone}
          onView={setViewing}
          onRetry={retry}
          onCancel={() => setStep("style")}
          onTryAnother={() => setStep("style")}
          onDelete={deletePhoto}
          onStartOver={reset}
          retrying={starting}
          deleting={deleting}
        />
      )}
    </ResponsiveDialog>
  );
}
