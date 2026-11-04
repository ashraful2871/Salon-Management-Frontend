"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Images, X } from "lucide-react";

import SafeImage from "@/components/Shared/SafeImage";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * Desktop: a large lead photo with up to four beside it, laid out for the
 * number of photos there are, and "Show all photos" on top. Phones: a
 * full-width swipe strip with a counter. Either opens the viewer.
 */
export default function SalonGallery({ images, name }: { images: string[]; name: string }) {
  const photos = images.length ? images : [null];
  const [viewer, setViewer] = useState<number | null>(null);
  const [mobileIdx, setMobileIdx] = useState(0);
  const real = images.length > 0;
  const open = (i: number) => real && setViewer(i);

  const shown = photos.slice(0, 5);
  const extra = images.length - shown.length;
  const layout = LAYOUTS[shown.length - 1];

  return (
    <>
      {/* Desktop and tablet */}
      <div className={cn("relative hidden h-[21rem] gap-2 md:grid lg:h-[25rem]", layout.grid)}>
        {shown.map((src, i) => (
          <GalleryTile
            key={i}
            src={src}
            alt={i === 0 ? name : ""}
            label={real ? `View photo ${i + 1} of ${images.length}` : undefined}
            onClick={real ? () => open(i) : undefined}
            preload={i === 0}
            sizes={i === 0 ? "(min-width:1024px) 50vw, 66vw" : "(min-width:1024px) 25vw, 33vw"}
            className={cn(
              layout.tiles[i],
              // Only the outer corners are rounded, so the set reads as one picture.
              layout.corners[i],
            )}
            more={i === shown.length - 1 && extra > 0 ? extra : 0}
          />
        ))}
        {images.length > 1 && (
          <button
            type="button"
            onClick={() => open(0)}
            className="absolute right-4 bottom-4 inline-flex h-9 items-center gap-2 rounded-full bg-surface/95 px-4 text-sm font-semibold text-foreground shadow-card ring-1 ring-black/5 backdrop-blur-sm transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Images className="size-4" aria-hidden /> Show all {images.length} photos
          </button>
        )}
      </div>

      {/* Phones */}
      <div className="relative -mx-4 aspect-[4/3] overflow-hidden bg-muted sm:-mx-6 md:hidden">
        <div
          className="flex size-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onScroll={(e) => {
            const el = e.currentTarget;
            setMobileIdx(Math.round(el.scrollLeft / el.clientWidth));
          }}
        >
          {photos.map((src, i) => (
            <div key={i} className="relative h-full min-w-full snap-center">
              <GalleryTile
                src={src}
                alt={i === 0 ? name : ""}
                label={real ? `View photo ${i + 1} of ${images.length}` : undefined}
                onClick={real ? () => open(i) : undefined}
                preload={i === 0}
                sizes="100vw"
                className="size-full"
              />
            </div>
          ))}
        </div>
        {images.length > 1 && (
          <span className="pointer-events-none absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white tabular-nums backdrop-blur-sm">
            <Images className="size-3.5" aria-hidden />
            {Math.min(mobileIdx + 1, images.length)} / {images.length}
          </span>
        )}
      </div>

      {real && (
        <PhotoViewer
          images={images}
          name={name}
          index={viewer}
          onIndex={setViewer}
        />
      )}
    </>
  );
}

/**
 * Grid shapes for 1–5 photos: the lead photo always takes the left half (or
 * two thirds when there are only two or three), and the rest fill the right
 * without odd letterbox crops.
 */
const LAYOUTS: { grid: string; tiles: string[]; corners: string[] }[] = [
  { grid: "grid-cols-1", tiles: [""], corners: ["rounded-3xl"] },
  {
    grid: "grid-cols-3",
    tiles: ["col-span-2", ""],
    corners: ["rounded-l-3xl", "rounded-r-3xl"],
  },
  {
    grid: "grid-cols-3 grid-rows-2",
    tiles: ["col-span-2 row-span-2", "", ""],
    corners: ["rounded-l-3xl", "rounded-tr-3xl", "rounded-br-3xl"],
  },
  {
    grid: "grid-cols-4 grid-rows-2",
    tiles: ["col-span-2 row-span-2", "col-span-2", "", ""],
    corners: ["rounded-l-3xl", "rounded-tr-3xl", "", "rounded-br-3xl"],
  },
  {
    grid: "grid-cols-4 grid-rows-2",
    tiles: ["col-span-2 row-span-2", "", "", "", ""],
    corners: ["rounded-l-3xl", "", "rounded-tr-3xl", "", "rounded-br-3xl"],
  },
];

/** One photo: a soft shimmer until it arrives, then a quick fade in. */
function GalleryTile({
  src,
  alt,
  label,
  onClick,
  preload,
  sizes,
  className,
  more = 0,
}: {
  src: string | null;
  alt: string;
  label?: string;
  onClick?: () => void;
  preload?: boolean;
  sizes: string;
  className?: string;
  more?: number;
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      aria-label={label}
      className={cn(
        "group relative overflow-hidden bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
        !loaded && "animate-pulse motion-reduce:animate-none",
        className,
      )}
    >
      <SafeImage
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        preload={preload}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        className={cn(
          "object-cover transition duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none",
          loaded ? "opacity-100" : "opacity-0",
        )}
      />
      {/* A light veil on hover says "you can open this". */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-300 group-enabled:group-hover:bg-black/10"
      />
      {more > 0 && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 grid place-items-center bg-black/45 text-lg font-semibold text-white"
        >
          +{more} more
        </span>
      )}
    </button>
  );
}

function PhotoViewer({
  images,
  name,
  index,
  onIndex,
}: {
  images: string[];
  name: string;
  index: number | null;
  onIndex: (i: number | null) => void;
}) {
  const i = index ?? 0;
  const many = images.length > 1;
  const go = (delta: number) => onIndex((i + delta + images.length) % images.length);

  return (
    <Dialog open={index !== null} onOpenChange={(v) => !v && onIndex(null)}>
      <DialogContent
        showCloseButton={false}
        onKeyDown={(e) => {
          if (!many) return;
          if (e.key === "ArrowRight") go(1);
          if (e.key === "ArrowLeft") go(-1);
        }}
        className="flex h-[100dvh] max-h-[100dvh] w-full max-w-none flex-col gap-0 rounded-none border-0 bg-foreground p-0 text-background sm:max-w-none md:h-[90dvh] md:max-w-5xl md:rounded-3xl"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <DialogTitle className="truncate text-base font-semibold text-background">{name}</DialogTitle>
            <DialogDescription className="text-sm text-background/70 tabular-nums">
              Photo {i + 1} of {images.length}
            </DialogDescription>
          </div>
          <button
            type="button"
            onClick={() => onIndex(null)}
            aria-label="Close photos"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-background/10 text-background transition-colors hover:bg-background/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <div className="relative min-h-0 flex-1">
          <SafeImage src={images[i]} alt={`${name}, photo ${i + 1}`} fill sizes="(min-width:768px) 64rem, 100vw" className="object-contain" />
          {many && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Previous photo"
                className="absolute top-1/2 left-3 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-surface text-foreground shadow-card transition-colors hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ChevronLeft className="size-5" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Next photo"
                className="absolute top-1/2 right-3 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-surface text-foreground shadow-card transition-colors hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ChevronRight className="size-5" aria-hidden />
              </button>
            </>
          )}
        </div>

        {many && (
          <div className="flex shrink-0 justify-center gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {images.map((src, k) => (
              <button
                key={k}
                type="button"
                onClick={() => onIndex(k)}
                aria-label={`Show photo ${k + 1}`}
                aria-current={k === i || undefined}
                className={cn(
                  "relative size-14 shrink-0 overflow-hidden rounded-xl border-2 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background",
                  k === i ? "border-background" : "border-transparent opacity-60 hover:opacity-100",
                )}
              >
                <SafeImage src={src} alt="" fill sizes="56px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
