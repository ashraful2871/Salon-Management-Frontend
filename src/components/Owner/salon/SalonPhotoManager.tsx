"use client";

import Image from "next/image";
import React, { useEffect, useId, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ImagePlus,
  Link2,
  Loader2,
  Star,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import SafeImage from "@/components/Shared/SafeImage";
import { ConfirmDialog } from "@/components/Shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { compressImage } from "@/components/HairTryOn/compressImage";
import { cn } from "@/lib/utils";
import { getSalonPhotoTicket } from "@/services/salon/getSalonPhotoTicket";
import { uploadSalonPhoto } from "@/services/salon/uploadSalonPhoto";
import { SALON_MAX_PHOTOS } from "@/services/salon/salon-photo-types";

type Upload = { key: string; preview: string; progress: number };

const ACCEPT = "image/jpeg,image/png,image/webp";

/**
 * The salon's photos in order; the first is the cover. Uploads go straight to
 * Cloudinary on a ticket the API signs, then `onChange` gets the whole new
 * list. The list is the caller's draft: Manage salon saves it from its save
 * bar, Add salon sends it with the form. Nothing here goes live on its own.
 */
export function SalonPhotoManager({
  salonId,
  images,
  onChange,
  disabled = false,
  saving = false,
  savedImages,
  onUploadingChange,
}: {
  /** The branch the photos belong to; omitted while adding a salon. */
  salonId?: string;
  images: string[];
  onChange: (next: string[]) => Promise<boolean> | boolean;
  disabled?: boolean;
  /** A save is in flight: actions wait for it. */
  saving?: boolean;
  /** What is live now; photos outside it carry a "Not saved" badge. */
  savedImages?: string[];
  /** True while any upload is in flight, so the caller can hold its Save. */
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const ids = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  // Uploads finish after renders that may have changed the list.
  const latest = useRef(images);
  useEffect(() => {
    latest.current = images;
  }, [images]);

  const [uploads, setUploads] = useState<Upload[]>([]);
  const [dragging, setDragging] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [link, setLink] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toRemove, setToRemove] = useState<string | null>(null);

  const uploading = uploads.length > 0;
  useEffect(() => {
    onUploadingChange?.(uploading);
  }, [uploading, onUploadingChange]);

  const busy = disabled || saving;
  const live = savedImages ? new Set(savedImages) : null;
  const room = SALON_MAX_PHOTOS - images.length - uploads.length;

  /* ---- Upload ---- */

  const addFiles = async (list: FileList | File[]) => {
    const files = Array.from(list).filter((f) => f.type.startsWith("image/"));
    if (busy || files.length === 0) return;
    if (room <= 0) {
      toast.error(`A salon can have up to ${SALON_MAX_PHOTOS} photos. Remove one first.`);
      return;
    }
    const chosen = files.slice(0, room);
    if (files.length > chosen.length) {
      toast.message(`Only ${chosen.length} more photo${chosen.length === 1 ? "" : "s"} fit, so the rest were skipped.`);
    }

    const batch: Upload[] = chosen.map((file, i) => ({
      key: `${Date.now()}-${i}-${file.name}`,
      preview: URL.createObjectURL(file),
      progress: 0,
    }));
    setUploads((prev) => [...prev, ...batch]);
    const setProgress = (key: string, progress: number) =>
      setUploads((prev) => prev.map((u) => (u.key === key ? { ...u, progress } : u)));
    const finish = () => {
      setUploads((prev) => prev.filter((u) => !batch.some((b) => b.key === u.key)));
      batch.forEach((b) => URL.revokeObjectURL(b.preview));
    };

    // One ticket covers the whole batch; it is valid for ten minutes.
    const ticket = await getSalonPhotoTicket(salonId);
    if (!ticket.success || !ticket.data) {
      finish();
      toast.error(ticket.message || "Couldn't prepare the upload. Please try again.");
      return;
    }

    const results = await Promise.all(
      chosen.map(async (file, i) => {
        const prepared = await compressImage(file);
        if (!prepared.ok) return { ok: false as const, message: prepared.message };
        if (prepared.blob.size > ticket.data!.maxBytes) {
          return { ok: false as const, message: "That photo is too large even after resizing." };
        }
        const sent = await uploadSalonPhoto(prepared.blob, ticket.data!, (p) => setProgress(batch[i].key, p));
        return sent.success && sent.data
          ? { ok: true as const, url: sent.data.url }
          : { ok: false as const, message: sent.message };
      }),
    );

    finish();
    const urls = results.flatMap((r) => (r.ok ? [r.url] : []));
    const failures = results.filter((r) => !r.ok);
    if (failures.length) {
      const first = failures[0] as { message: string };
      toast.error(
        failures.length === 1
          ? first.message
          : `${failures.length} photos didn't upload. ${first.message}`,
      );
    }
    if (urls.length) {
      await onChange([...latest.current, ...urls].slice(0, SALON_MAX_PHOTOS));
    }
  };

  /* ---- Order, cover, remove ---- */

  const move = (from: number, to: number) => {
    if (busy || to < 0 || to >= images.length) return;
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    void onChange(next);
  };

  const askRemove = (url: string) => {
    setToRemove(url);
    setConfirmOpen(true);
  };

  const remove = () => {
    setConfirmOpen(false);
    if (!toRemove) return;
    void onChange(images.filter((u) => u !== toRemove));
  };

  const addLink = async () => {
    const url = link.trim();
    if (!url) return;
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new Error();
    } catch {
      toast.error("That doesn't look like a link. It should start with https://");
      return;
    }
    if (images.includes(url)) {
      toast.error("That photo is already in the list.");
      return;
    }
    if (room <= 0) {
      toast.error(`A salon can have up to ${SALON_MAX_PHOTOS} photos. Remove one first.`);
      return;
    }
    const ok = await onChange([...images, url]);
    if (ok !== false) {
      setLink("");
      setLinkOpen(false);
    }
  };

  /* ---- Render ---- */

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          if (busy || !e.dataTransfer.types.includes("Files")) return;
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "rounded-2xl transition-colors",
          dragging && "bg-primary-soft/60 ring-2 ring-primary/40 ring-offset-4 ring-offset-surface",
        )}
      >
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4" aria-label="Salon photos">
          {images.map((url, i) => (
            <li
              key={url}
              className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-muted"
            >
              <SafeImage
                src={url}
                alt={i === 0 ? "Cover photo" : `Photo ${i + 1}`}
                fill
                sizes="(min-width: 1280px) 20vw, (min-width: 640px) 30vw, 45vw"
                className="object-cover"
              />
              <div className="absolute inset-x-2 top-2 flex flex-wrap items-start gap-1.5">
                {i === 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground shadow-sm">
                    <Star className="size-3 fill-current" aria-hidden="true" />
                    Cover
                  </span>
                )}
                {live && !live.has(url) && (
                  <span className="rounded-full bg-warning-soft px-2 py-0.5 text-xs font-semibold text-warning shadow-sm">
                    Not saved
                  </span>
                )}
              </div>
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/70 to-transparent p-1.5 pt-6">
                <div className="flex items-center gap-1">
                  <TileButton
                    label={`Move photo ${i + 1} earlier`}
                    disabled={busy || i === 0}
                    onClick={() => move(i, i - 1)}
                  >
                    <ArrowLeft />
                  </TileButton>
                  <TileButton
                    label={`Move photo ${i + 1} later`}
                    disabled={busy || i === images.length - 1}
                    onClick={() => move(i, i + 1)}
                  >
                    <ArrowRight />
                  </TileButton>
                </div>
                <div className="flex items-center gap-1">
                  {i > 0 && (
                    <TileButton label={`Make photo ${i + 1} the cover`} disabled={busy} onClick={() => move(i, 0)}>
                      <Star />
                    </TileButton>
                  )}
                  <TileButton
                    label={`Remove photo ${i + 1}`}
                    disabled={busy}
                    onClick={() => askRemove(url)}
                    className="hover:text-danger"
                  >
                    <Trash2 />
                  </TileButton>
                </div>
              </div>
            </li>
          ))}

          {uploads.map((u) => (
            <li
              key={u.key}
              className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-muted"
              aria-label="Uploading photo"
            >
              <Image src={u.preview} alt="" fill unoptimized className="object-cover opacity-60" />
              <div className="absolute inset-0 grid place-items-center">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1 text-xs font-medium shadow-sm tabular-nums">
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  {u.progress < 100 ? `${u.progress}%` : "Processing"}
                </span>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-1 bg-black/20">
                <div className="h-full bg-primary transition-[width]" style={{ width: `${u.progress}%` }} />
              </div>
            </li>
          ))}

          {room > 0 && (
            <li className="aspect-[4/3]">
              <button
                type="button"
                disabled={busy}
                onClick={() => fileInput.current?.click()}
                className="flex size-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border bg-surface-subtle px-3 text-center text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary-soft/40 hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ImagePlus className="size-6" aria-hidden="true" />
                <span className="font-medium">{images.length === 0 ? "Add a cover photo" : "Add photos"}</span>
                <span className="hidden text-xs sm:block">or drop them here</span>
              </button>
            </li>
          )}
        </ul>
      </div>

      <input
        ref={fileInput}
        id={`${ids}-file`}
        type="file"
        accept={ACCEPT}
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          if (e.target.files) void addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {images.length}/{SALON_MAX_PHOTOS} photos · JPG, PNG or WebP. The first photo is the cover; use the arrows
          or the star to reorder.
        </p>
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => setLinkOpen((v) => !v)}>
            <Link2 />
            Add from link
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy || room <= 0}
            onClick={() => fileInput.current?.click()}
          >
            {saving || uploads.length > 0 ? <Loader2 className="animate-spin" /> : <Upload />}
            Upload
          </Button>
        </div>
      </div>

      {linkOpen && (
        <div className="flex gap-2">
          <Input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault(); // adds, never submits a surrounding form
                void addLink();
              }
            }}
            inputMode="url"
            placeholder="https://…"
            aria-label="Photo link"
            disabled={busy}
            autoFocus
          />
          <Button type="button" variant="outline" disabled={busy || !link.trim()} onClick={() => void addLink()}>
            Add
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Remove this photo?"
        description={
          images[0] === toRemove && images.length > 1
            ? "This is the cover, so the next photo becomes the cover once you save."
            : savedImages
              ? "It comes off your salon page once you save. Until then, Discard brings it back."
              : "It's taken off the list."
        }
        confirmLabel="Remove"
        tone="danger"
        onConfirm={remove}
      />
    </div>
  );
}

function TileButton({
  label,
  className,
  ...props
}: React.ComponentProps<"button"> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "grid size-8 place-items-center rounded-full bg-surface/95 text-foreground shadow-sm transition-colors hover:bg-surface disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4",
        className,
      )}
      {...props}
    />
  );
}
