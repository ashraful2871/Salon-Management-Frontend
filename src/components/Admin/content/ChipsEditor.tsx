"use client";

import { useId } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SERVICE_CATEGORIES } from "@/constants/service-categories";
import type { HomeChip } from "@/services/settings/getPublicSettings";
import { move, RowControls } from "./ContentSection";

const MAX_CHIPS = 12;
const MAX_LABEL = 24;

/** Both targets are kept while editing, so switching the mode loses nothing. */
export type ChipDraft = {
  label: string;
  mode: "category" | "query";
  query: string;
  category: string;
};

/** Mirrors the API's homeChipSchema. */
export const checkChips = (rows: ChipDraft[]): string | null => {
  if (rows.length > MAX_CHIPS) return `At most ${MAX_CHIPS} chips`;
  for (const [i, c] of rows.entries()) {
    const n = `Chip ${i + 1}`;
    if (!c.label.trim()) return `${n}: write a label`;
    if (c.label.trim().length > MAX_LABEL) return `${n}: at most ${MAX_LABEL} characters`;
    if (c.mode === "query" && !c.query.trim()) return `${n}: write the search text`;
    if (c.mode === "category" && !c.category) return `${n}: pick a category`;
  }
  return null;
};

export const tidyChips = (rows: ChipDraft[]): HomeChip[] =>
  rows.map((c) =>
    c.mode === "category"
      ? { label: c.label.trim(), category: c.category }
      : { label: c.label.trim(), query: c.query.trim() },
  );

/** An editable, reorderable list of label + (search text | category). */
export function ChipsEditor({
  rows,
  onChange,
}: {
  rows: ChipDraft[];
  onChange: (rows: ChipDraft[]) => void;
}) {
  const id = useId();
  const set = (i: number, patch: Partial<ChipDraft>) =>
    onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  return (
    <div className="space-y-3">
      {rows.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No chips saved: the home page shows the built-in five.
        </p>
      )}
      <ol aria-label="Chips, in order" className="space-y-3">
        {rows.map((row, i) => (
          <li key={i} className="rounded-xl border p-3">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-0 flex-1 basis-40 space-y-1.5">
                <Label htmlFor={`${id}-${i}-label`}>Label</Label>
                <Input
                  id={`${id}-${i}-label`}
                  value={row.label}
                  maxLength={MAX_LABEL}
                  onChange={(e) => set(i, { label: e.target.value })}
                />
              </div>
              <div className="w-full space-y-1.5 sm:w-36">
                <Label htmlFor={`${id}-${i}-mode`}>Opens</Label>
                <Select value={row.mode} onValueChange={(mode) => set(i, { mode: mode as ChipDraft["mode"] })}>
                  <SelectTrigger id={`${id}-${i}-mode`} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="category">A category</SelectItem>
                    <SelectItem value="query">A search</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-0 flex-1 basis-40 space-y-1.5">
                {row.mode === "category" ? (
                  <>
                    <Label htmlFor={`${id}-${i}-target`}>Category</Label>
                    <Select value={row.category} onValueChange={(category) => set(i, { category })}>
                      <SelectTrigger id={`${id}-${i}-target`} className="w-full">
                        <SelectValue placeholder="Pick one" />
                      </SelectTrigger>
                      <SelectContent>
                        {SERVICE_CATEGORIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                ) : (
                  <>
                    <Label htmlFor={`${id}-${i}-target`}>Search text</Label>
                    <Input
                      id={`${id}-${i}-target`}
                      value={row.query}
                      maxLength={100}
                      placeholder="e.g. bridal makeup"
                      onChange={(e) => set(i, { query: e.target.value })}
                    />
                  </>
                )}
              </div>
              <RowControls
                index={i}
                count={rows.length}
                label={row.label || `chip ${i + 1}`}
                disabled={false}
                onMove={(by) => onChange(move(rows, i, by))}
                onRemove={() => onChange(rows.filter((_, j) => j !== i))}
              />
            </div>
          </li>
        ))}
      </ol>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={rows.length >= MAX_CHIPS}
        onClick={() => onChange([...rows, { label: "", mode: "category", query: "", category: "" }])}
      >
        <Plus />
        Add a chip
      </Button>
    </div>
  );
}
