"use client";

import { useActionState, useId, useState } from "react";
import { ImageIcon, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ResponsiveDialog } from "@/components/Shared/ResponsiveDialog";
import { showResultToast } from "@/components/Shared/showResultToast";
import { createService } from "@/services/service/createService";
import { updateService } from "@/services/service/updateService";
import type { ApiResponse, SalonService } from "@/lib/api-types";
import { toTaka } from "@/lib/money";

export type AddServicePayload = {
  name: string;
  description: string;
  category: string;
  price: string;
  duration: string;
  salonId: string;
  images: string[];
};

const CATEGORIES = [
  "HAIRCUT",
  "STYLING",
  "COLORING",
  "TREATMENT",
  "SPA",
  "FACIAL",
  "MANICURE",
  "PEDICURE",
  "MAKEUP",
  "WAXING",
  "MASSAGE",
  "OTHER",
];

// Native, not Radix: a Radix Select portal inside the phone's drawer fights
// the drawer for focus and scroll, and the native picker suits a phone anyway.
const SELECT_CLASS =
  "border-input h-11 w-full min-w-0 rounded-xl border bg-surface px-3 text-base shadow-xs outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring md:h-10 md:text-sm";

const initialForm = (
  service: SalonService | null | undefined,
  salons: { id: string }[],
): AddServicePayload =>
  service
    ? {
        name: service.name,
        description: service.description ?? "",
        category: service.category ?? "HAIRCUT",
        price:
          typeof service.priceMinor === "number"
            ? String(toTaka(service.priceMinor))
            : "",
        duration: service.duration ? String(service.duration) : "",
        salonId: service.salonId ?? salons[0]?.id ?? "",
        images: service.images ?? [],
      }
    : {
        name: "",
        description: "",
        category: "HAIRCUT",
        price: "",
        duration: "",
        salonId: salons[0]?.id ?? "",
        images: [],
      };

/**
 * Add a service, or edit one when `service` is passed. The parent remounts it
 * (a new `key`) each time it opens, so the fields always start from `service`.
 */
export default function AddServiceModal({
  open,
  setOpen,
  salons,
  service,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  salons: { id: string; name: string }[];
  service?: SalonService | null;
}) {
  const formId = useId();
  const [form, setForm] = useState(() => initialForm(service, salons));
  const [imageUrl, setImageUrl] = useState("");

  // The dialog closes only once the API has answered, so the form stays in
  // view (and editable after a failure) while it saves.
  const [, formAction, isPending] = useActionState(
    async (
      previous: ApiResponse<SalonService> | null,
      formData: FormData,
    ): Promise<ApiResponse<SalonService>> => {
      const result = service
        ? await updateService(service.id, {
            name: String(formData.get("name") ?? "").trim(),
            description: String(formData.get("description") ?? ""),
            category: String(formData.get("category") ?? ""),
            price: Number(formData.get("price")),
            duration: Number(formData.get("duration")),
            images: JSON.parse(String(formData.get("images") || "[]")),
          })
        : await createService(previous, formData);

      showResultToast(
        result,
        service ? "Service updated" : "Service added",
        service ? "Failed to update the service" : "Failed to add the service",
      );
      if (result.success) setOpen(false);
      return result;
    },
    null,
  );

  const update = <K extends keyof AddServicePayload>(
    key: K,
    value: AddServicePayload[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const addImage = () => {
    const url = imageUrl.trim();
    if (!url || form.images.includes(url)) return;
    update("images", [...form.images, url]);
    setImageUrl("");
  };

  const isValid =
    form.name.trim() &&
    form.category &&
    Number(form.price) > 0 &&
    Number(form.duration) > 0 &&
    form.salonId;

  const field = (name: string) => `${formId}-${name}`;

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(next) => !isPending && setOpen(next)}
      title={service ? "Edit service" : "Add service"}
      description={
        service
          ? "Changes show on your salon page as soon as they're saved."
          : "Customers can book it once it has slots."
      }
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" form={formId} disabled={!isValid} loading={isPending}>
            {service ? "Save changes" : "Save service"}
          </Button>
        </>
      }
    >
      <form id={formId} action={formAction} className="space-y-4">
        <input type="hidden" name="images" value={JSON.stringify(form.images)} />
        <input type="hidden" name="salonId" value={form.salonId} />

        {!service && salons.length === 0 && (
          <p className="rounded-xl bg-warning-soft px-3 py-2 text-sm text-warning">
            Add a salon first: every service belongs to one.
          </p>
        )}

        {/* A service can't move between salons, so the picker is for new ones. */}
        {!service && salons.length > 1 && (
          <div className="space-y-2">
            <Label htmlFor={field("salon")}>Salon</Label>
            <select
              id={field("salon")}
              value={form.salonId}
              onChange={(e) => update("salonId", e.target.value)}
              className={SELECT_CLASS}
            >
              {salons.map((salon) => (
                <option key={salon.id} value={salon.id}>
                  {salon.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={field("name")}>Name</Label>
            <Input
              id={field("name")}
              name="name"
              required
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="e.g. Haircut & styling"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={field("category")}>Category</Label>
            <select
              id={field("category")}
              name="category"
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
              className={SELECT_CLASS}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0) + cat.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={field("price")}>Price (৳)</Label>
            <Input
              id={field("price")}
              name="price"
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              required
              value={form.price}
              onChange={(e) => update("price", e.target.value)}
              placeholder="e.g. 500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={field("duration")}>Duration (min)</Label>
            <Input
              id={field("duration")}
              name="duration"
              type="number"
              inputMode="numeric"
              min="1"
              required
              value={form.duration}
              onChange={(e) => update("duration", e.target.value)}
              placeholder="e.g. 45"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor={field("description")}>Description</Label>
          <Textarea
            id={field("description")}
            name="description"
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="A line or two about the service"
            className="min-h-[88px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={field("image")}>Images</Label>
          <div className="flex gap-2">
            <Input
              id={field("image")}
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addImage();
                }
              }}
              placeholder="Paste an image link"
            />
            <Button type="button" variant="outline" onClick={addImage} className="shrink-0">
              <Plus aria-hidden="true" />
              Add
            </Button>
          </div>
          {form.images.length === 0 ? (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <ImageIcon aria-hidden="true" className="size-4" />
              No images yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {form.images.map((url) => (
                <li
                  key={url}
                  className="flex items-center justify-between gap-2 rounded-xl border border-border bg-surface-subtle py-1 pr-1 pl-3"
                >
                  <span className="min-w-0 truncate text-xs text-muted-foreground">{url}</span>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    className="shrink-0 text-danger hover:bg-danger-soft hover:text-danger"
                    aria-label="Remove image"
                    onClick={() =>
                      update(
                        "images",
                        form.images.filter((u) => u !== url),
                      )
                    }
                  >
                    <X aria-hidden="true" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </form>
    </ResponsiveDialog>
  );
}
