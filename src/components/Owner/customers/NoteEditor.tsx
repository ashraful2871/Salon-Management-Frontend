"use client";

import { useId, useState, useTransition } from "react";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveCustomerNote } from "@/services/owner/saveCustomerNote";
import type { CustomerNote } from "@/services/owner/customer-types";

const MAX_TAGS = 10;
const MAX_TAG = 24;
const MAX_NOTE = 1000;

/**
 * The business's private note and tags on one customer. Only the business
 * sees them; they never reach the customer.
 */
export function NoteEditor({ customerId, initial }: { customerId: string; initial: CustomerNote }) {
  const ids = useId();
  const [note, setNote] = useState(initial.note ?? "");
  const [tags, setTags] = useState(initial.tags);
  const [draft, setDraft] = useState("");
  const [saved, setSaved] = useState({ note: initial.note ?? "", tags: initial.tags });
  const [isPending, startTransition] = useTransition();

  const dirty = note !== saved.note || tags.join("\n") !== saved.tags.join("\n");

  const addTag = () => {
    const tag = draft.trim().toLowerCase().slice(0, MAX_TAG);
    setDraft("");
    if (!tag || tags.includes(tag) || tags.length >= MAX_TAGS) return;
    setTags([...tags, tag]);
  };

  const save = () =>
    startTransition(async () => {
      const result = await saveCustomerNote(customerId, { note: note.trim() || null, tags });
      if (!result.success || !result.data) {
        toast.error(result.message || "Couldn't save the note.");
        return;
      }
      const next = { note: result.data.note ?? "", tags: result.data.tags };
      setNote(next.note);
      setTags(next.tags);
      setSaved(next);
      toast.success("Note saved");
    });

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor={`${ids}-tag`}>Tags</Label>
        {tags.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label="Tags">
            {tags.map((tag) => (
              <li
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-primary-soft py-0.5 pl-2.5 pr-1 text-xs font-medium text-primary"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => setTags(tags.filter((t) => t !== tag))}
                  className="rounded-full p-0.5 hover:bg-primary/10"
                  aria-label={`Remove tag ${tag}`}
                >
                  <X className="size-3" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2">
          <Input
            id={`${ids}-tag`}
            value={draft}
            maxLength={MAX_TAG}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder={tags.length >= MAX_TAGS ? "Up to 10 tags" : "e.g. vip, prefers-rina"}
            disabled={tags.length >= MAX_TAGS}
          />
          <Button type="button" variant="outline" onClick={addTag} disabled={!draft.trim() || tags.length >= MAX_TAGS}>
            Add
          </Button>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`${ids}-note`}>Note</Label>
        <Textarea
          id={`${ids}-note`}
          value={note}
          maxLength={MAX_NOTE}
          rows={4}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Allergies, preferences, anything the team should know."
        />
        <p className="text-xs text-muted-foreground">
          Only your business sees this. {note.length}/{MAX_NOTE}
        </p>
      </div>

      <Button onClick={save} disabled={!dirty || isPending}>
        {isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
        Save note
      </Button>
    </div>
  );
}
