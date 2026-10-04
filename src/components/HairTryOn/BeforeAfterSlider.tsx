"use client";

import {
  useEffect,
  useRef,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { ChevronsLeftRight } from "lucide-react";
import SafeImage from "@/components/Shared/SafeImage";
import { cn } from "@/lib/utils";

const SWEEP_MS = 5200;
const SWEEP_CENTER = 50;
const SWEEP_REACH = 38;
const RESUME_AFTER_MS = 6000;

const clamp = (n: number) => Math.min(100, Math.max(0, n));

/**
 * Two layers, the "after" revealed to the right of a draggable handle. Works
 * with mouse, touch and keyboard. With `autoPlay` the handle sweeps back and
 * forth on its own until someone takes it, and starts again a few seconds
 * after they let go. The position lives in a CSS variable, so the sweep never
 * re-renders React.
 */
export function CompareSlider({
  before,
  after,
  autoPlay = false,
  onCycle,
  label = "Compare before and after",
  beforeLabel = "Before",
  afterLabel = "After",
  className,
}: {
  before: ReactNode;
  after: ReactNode;
  autoPlay?: boolean;
  /** Called each time an autoplay sweep is back on "before". */
  onCycle?: () => void;
  label?: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const handle = useRef<HTMLDivElement>(null);
  const position = useRef(autoPlay ? SWEEP_CENTER + SWEEP_REACH : 50);
  const dragging = useRef(false);
  const touchedAt = useRef(0);
  const onCycleRef = useRef(onCycle);
  useEffect(() => {
    onCycleRef.current = onCycle;
  }, [onCycle]);

  const apply = (pct: number) => {
    position.current = clamp(pct);
    box.current?.style.setProperty("--pos", `${position.current}%`);
    handle.current?.setAttribute("aria-valuenow", String(Math.round(position.current)));
    handle.current?.setAttribute(
      "aria-valuetext",
      `${Math.round(100 - position.current)}% ${afterLabel.toLowerCase()}`,
    );
  };

  useEffect(() => {
    const el = box.current;
    if (!autoPlay || !el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      apply(50);
      return;
    }

    let frame = 0;
    let visible = false;
    let elapsed = 0;
    let last = 0;
    let wasIdle = true;

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const idle = !dragging.current && now - touchedAt.current > RESUME_AFTER_MS;
      if (!idle) {
        wasIdle = false;
        last = now;
        return;
      }
      if (!wasIdle) {
        // Pick the sweep up from wherever the visitor left the handle.
        const x = (position.current - SWEEP_CENTER) / SWEEP_REACH;
        elapsed = (Math.acos(Math.max(-1, Math.min(1, x))) / (2 * Math.PI)) * SWEEP_MS;
        wasIdle = true;
      } else {
        const before = Math.floor(elapsed / SWEEP_MS);
        elapsed += Math.min(64, now - (last || now));
        if (Math.floor(elapsed / SWEEP_MS) > before) onCycleRef.current?.();
      }
      last = now;
      apply(SWEEP_CENTER + SWEEP_REACH * Math.cos((2 * Math.PI * elapsed) / SWEEP_MS));
    };

    // Only animate while on screen.
    const io = new IntersectionObserver(([entry]) => {
      const next = entry.isIntersecting;
      if (next === visible) return;
      visible = next;
      cancelAnimationFrame(frame);
      if (visible) {
        last = 0;
        frame = requestAnimationFrame(tick);
      }
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
    };
    // apply only touches refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay]);

  const touch = () => {
    touchedAt.current = performance.now();
  };

  const moveTo = (clientX: number) => {
    const rect = box.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    apply(((clientX - rect.left) / rect.width) * 100);
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    touch();
    e.currentTarget.setPointerCapture(e.pointerId);
    moveTo(e.clientX);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    touch();
    moveTo(e.clientX);
  };
  const onPointerUp = () => {
    dragging.current = false;
    touch();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.key === "ArrowLeft" ? -5 : e.key === "ArrowRight" ? 5 : null;
    if (e.key === "Home") apply(0);
    else if (e.key === "End") apply(100);
    else if (step === null) return;
    else apply(position.current + step);
    touch();
    e.preventDefault();
  };

  const start = Math.round(position.current);

  return (
    <div
      ref={box}
      // vaul would otherwise read the drag as closing the phone sheet.
      data-vaul-no-drag
      className={cn(
        "relative isolate w-full cursor-ew-resize touch-pan-y overflow-hidden rounded-2xl bg-muted select-none",
        className,
      )}
      style={{ "--pos": `${start}%` } as CSSProperties}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div className="absolute inset-0">{before}</div>
      <div className="absolute inset-0 [clip-path:inset(0_0_0_var(--pos))]">{after}</div>

      <div className="pointer-events-none absolute inset-y-0 left-(--pos) w-0.5 -translate-x-1/2 bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.08)]" />
      <div
        ref={handle}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={start}
        aria-valuetext={`${100 - start}% ${afterLabel.toLowerCase()}`}
        onKeyDown={onKeyDown}
        onFocus={touch}
        className="absolute top-1/2 left-(--pos) flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-foreground shadow-lg ring-1 ring-black/5 outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <ChevronsLeftRight className="size-5" aria-hidden />
      </div>

      <span className="pointer-events-none absolute top-3 left-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white">
        {beforeLabel}
      </span>
      <span className="pointer-events-none absolute top-3 right-3 rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground">
        {afterLabel}
      </span>
    </div>
  );
}

/**
 * The result over the original. Both images are signed Cloudinary URLs, so
 * they skip the Next optimizer.
 */
export function BeforeAfterSlider({
  beforeUrl,
  afterUrl,
  styleName,
}: {
  beforeUrl: string;
  afterUrl: string;
  styleName: string;
}) {
  return (
    <CompareSlider
      className="mx-auto aspect-[4/5] max-w-[calc(55dvh*0.8)]"
      before={
        <SafeImage
          src={beforeUrl}
          alt="Your photo"
          fill
          unoptimized
          draggable={false}
          className="object-cover"
        />
      }
      after={
        <SafeImage
          src={afterUrl}
          alt={`Your photo with ${styleName}`}
          fill
          unoptimized
          draggable={false}
          className="object-cover"
        />
      }
    />
  );
}
