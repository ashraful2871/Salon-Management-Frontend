"use client";

import { useRef, useState } from "react";
import { CircleCheck, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { getHomeDocSignature } from "@/services/home-service/getHomeDocSignature";
import { saveHomeExpertDoc } from "@/services/home-service/saveHomeExpertDoc";
import type { HomeDocKind, OwnerHomeExpert } from "@/services/home-service/types";
import { uploadToCloudinary } from "@/services/hairstyle/uploadToCloudinary";

const SLOTS: { kind: HomeDocKind; field: keyof OwnerHomeExpert["docs"]; label: string }[] = [
  { kind: "ID_FRONT", field: "idFront", label: "ID front" },
  { kind: "ID_BACK", field: "idBack", label: "ID back" },
  { kind: "SELFIE", field: "selfie", label: "Selfie" },
];

const ACCEPT = "image/jpeg,image/png,image/webp,application/pdf";
const MAX_BYTES = 8 * 1024 * 1024;

/** One document: signed ticket, straight to the private store, then recorded on the expert. */
function DocSlot({
  salonId,
  expertId,
  kind,
  label,
  done,
}: {
  salonId: string;
  expertId: string;
  kind: HomeDocKind;
  label: string;
  done: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);

  const upload = async (file: File) => {
    if (!ACCEPT.split(",").includes(file.type)) {
      toast.error("Use a JPG, PNG, WEBP or PDF file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("The file can be up to 8 MB.");
      return;
    }
    setProgress(0);
    const ticket = await getHomeDocSignature(expertId, kind);
    if (!ticket.success || !ticket.data) {
      toast.error(ticket.message);
      setProgress(null);
      return;
    }
    const sent = await uploadToCloudinary(file, ticket.data, setProgress);
    if (!sent.success) {
      toast.error(sent.message);
      setProgress(null);
      return;
    }
    const saved = await saveHomeExpertDoc(salonId, expertId, {
      kind,
      publicId: ticket.data.params.public_id,
      bytes: file.size,
    });
    if (!saved.success) toast.error(saved.message);
    setProgress(null);
  };

  return (
    <li className="rounded-xl border border-border p-3">
      <div className="flex items-center gap-2">
        {done && <CircleCheck aria-hidden="true" className="size-4 shrink-0 text-success" />}
        <span className="min-w-0 flex-1 text-sm font-medium">
          {label}
          <span className="sr-only">{done ? " uploaded" : " not uploaded"}</span>
        </span>
        <input
          ref={input}
          type="file"
          accept={ACCEPT}
          className="hidden"
          aria-label={`Upload ${label}`}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void upload(file);
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={progress !== null}
          onClick={() => input.current?.click()}
        >
          <Upload aria-hidden="true" />
          {done ? "Replace" : "Upload"}
        </Button>
      </div>
      {progress !== null && (
        <div
          role="progressbar"
          aria-label={`Uploading ${label}`}
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
        >
          <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${progress}%` }} />
        </div>
      )}
    </li>
  );
}

/** ID front, ID back and a selfie. Private: only the admin who verifies can open them. */
export function DocSlots({ salonId, expert }: { salonId: string; expert: OwnerHomeExpert }) {
  return (
    <ul className="space-y-2">
      {SLOTS.map((slot) => (
        <DocSlot
          key={slot.kind}
          salonId={salonId}
          expertId={expert.id}
          kind={slot.kind}
          label={slot.label}
          done={expert.docs[slot.field]}
        />
      ))}
    </ul>
  );
}
