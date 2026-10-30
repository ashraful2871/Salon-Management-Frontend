"use client";

import { useId, useState, useTransition } from "react";
import { Plus, X } from "lucide-react";

import { ResponsiveDialog } from "@/components/Shared/ResponsiveDialog";
import { showResultToast } from "@/components/Shared/showResultToast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toMinor, toTaka } from "@/lib/money";
import { createHomeOffering } from "@/services/home-service/createHomeOffering";
import type { HomeAudience, HomeCategory, HomeOffering } from "@/services/home-service/types";
import { updateHomeOffering } from "@/services/home-service/updateHomeOffering";
import { CATEGORY_LABEL, durationText } from "../content";
import { CATEGORIES_FOR, SIDE_LABEL } from "./format";

const PRICE_MIN = 10;
const PRICE_MAX = 100_000;
const MAX_IMAGES = 5;
const DURATIONS = Array.from({ length: 32 }, (_, i) => (i + 1) * 15);

/** Add or edit one service of the menu. Mounted per open, so it starts from `offering`. */
export function OfferingDialog({
  salonId,
  audience,
  offering,
  open,
  onOpenChange,
}: {
  salonId: string;
  audience: HomeAudience;
  offering: HomeOffering | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const id = useId();
  const field = (name: string) => `${id}-${name}`;
  const [name, setName] = useState(offering?.name ?? "");
  const [category, setCategory] = useState<HomeCategory>(offering?.category ?? CATEGORIES_FOR[audience][0]);
  const [duration, setDuration] = useState(offering?.durationMin ?? 60);
  const [price, setPrice] = useState(offering ? String(toTaka(offering.priceMinor)) : "");
  const [description, setDescription] = useState(offering?.description ?? "");
  const [kitNote, setKitNote] = useState(offering?.kitNote ?? "");
  const [images, setImages] = useState(offering?.images ?? []);
  const [imageUrl, setImageUrl] = useState("");
  const [pending, start] = useTransition();

  const priceValue = Number(price);
  const valid = name.trim().length >= 2 && priceValue >= PRICE_MIN && priceValue <= PRICE_MAX;

  const addImage = () => {
    const url = imageUrl.trim();
    if (!URL.canParse(url) || images.includes(url) || images.length >= MAX_IMAGES) return;
    setImages([...images, url]);
    setImageUrl("");
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!valid) return;
    const input = {
      name: name.trim(),
      category,
      durationMin: duration,
      priceMinor: toMinor(priceValue),
      description: description.trim() || null,
      kitNote: kitNote.trim() || null,
      images,
    };
    start(async () => {
      const res = offering
        ? await updateHomeOffering(salonId, offering.id, input)
        : await createHomeOffering({ ...input, salonId, audience });
      showResultToast(res);
      if (res.success) onOpenChange(false);
    });
  };

  // `category` may be one the other side's list has, on an older row: keep it choosable.
  const categories = CATEGORIES_FOR[audience].includes(category)
    ? CATEGORIES_FOR[audience]
    : [category, ...CATEGORIES_FOR[audience]];

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={offering ? "Edit service" : `Add a ${SIDE_LABEL[audience]} service`}
      description={offering ? "New prices apply to new bookings." : undefined}
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" form={field("form")} loading={pending} disabled={!valid}>
            {offering ? "Save" : "Add service"}
          </Button>
        </>
      }
    >
      <form id={field("form")} onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor={field("name")}>Name</Label>
          <Input id={field("name")} value={name} maxLength={80} onChange={(e) => setName(e.target.value)} required />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="min-w-0 space-y-1.5">
            <Label htmlFor={field("category")}>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as HomeCategory)}>
              <SelectTrigger id={field("category")} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {CATEGORY_LABEL[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-0 space-y-1.5">
            <Label htmlFor={field("duration")}>Duration</Label>
            <Select value={String(duration)} onValueChange={(v) => setDuration(Number(v))}>
              <SelectTrigger id={field("duration")} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-64">
                {DURATIONS.map((d) => (
                  <SelectItem key={d} value={String(d)}>
                    {durationText(d)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={field("price")}>Price (৳)</Label>
          <Input
            id={field("price")}
            type="number"
            inputMode="numeric"
            min={PRICE_MIN}
            max={PRICE_MAX}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={field("description")}>Description (optional)</Label>
          <Textarea
            id={field("description")}
            value={description}
            maxLength={500}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={field("kit")}>What the expert brings (optional)</Label>
          <Input id={field("kit")} value={kitNote} maxLength={200} onChange={(e) => setKitNote(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={field("image")}>Photos (optional, up to {MAX_IMAGES})</Label>
          <div className="flex gap-2">
            <Input
              id={field("image")}
              type="url"
              value={imageUrl}
              placeholder="Paste an image link"
              onChange={(e) => setImageUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addImage();
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              className="shrink-0"
              onClick={addImage}
              disabled={images.length >= MAX_IMAGES}
            >
              <Plus aria-hidden="true" />
              Add
            </Button>
          </div>
          {images.length > 0 && (
            <ul className="space-y-1">
              {images.map((url) => (
                <li key={url} className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-xs">
                  <span className="min-w-0 flex-1 truncate">{url}</span>
                  <button
                    type="button"
                    aria-label="Remove this photo"
                    className="grid size-6 shrink-0 cursor-pointer place-items-center rounded-full hover:bg-surface"
                    onClick={() => setImages(images.filter((u) => u !== url))}
                  >
                    <X aria-hidden="true" className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </form>
    </ResponsiveDialog>
  );
}
