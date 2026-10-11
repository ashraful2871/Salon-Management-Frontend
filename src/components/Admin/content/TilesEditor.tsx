"use client";

import { useId } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconTile } from "@/components/Shared/FeatureCard";
import { categoryLabel } from "@/constants/service-categories";
import { contentIcon } from "@/lib/content-icons";
import type { CategoryTile } from "@/services/settings/getPublicSettings";
import { move, RowControls } from "./ContentSection";

const MAX_LABEL = 40;

/** Mirrors the API's categoryTileSchema. */
export const checkTiles = (rows: CategoryTile[]): string | null => {
  for (const t of rows) {
    const n = categoryLabel(t.category);
    if (!t.labelEn.trim() || !t.labelBn.trim()) return `${n}: write both labels`;
    if (t.labelEn.trim().length > MAX_LABEL || t.labelBn.trim().length > MAX_LABEL) {
      return `${n}: labels are at most ${MAX_LABEL} characters`;
    }
  }
  return null;
};

/** The list order is the tile order. */
export const tidyTiles = (rows: CategoryTile[]): CategoryTile[] =>
  rows.map((t, order) => ({ ...t, labelEn: t.labelEn.trim(), labelBn: t.labelBn.trim(), order }));

/** Per category: labels (EN/BN), icon, shown or not, and its place in the grid. */
export function TilesEditor({
  rows,
  icons,
  onChange,
}: {
  rows: CategoryTile[];
  icons: string[];
  onChange: (rows: CategoryTile[]) => void;
}) {
  const id = useId();
  const set = (i: number, patch: Partial<CategoryTile>) =>
    onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  return (
    <ol aria-label="Category tiles, in order" className="space-y-3">
      {rows.map((tile, i) => {
        const name = categoryLabel(tile.category);
        const base = `${id}-${tile.category}`;
        return (
          <li key={tile.category} className="rounded-xl border p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2">
                <IconTile icon={contentIcon(tile.icon)} />
                <span className="truncate text-sm font-semibold">{name}</span>
              </span>
              <RowControls
                index={i}
                count={rows.length}
                label={name}
                disabled={false}
                onMove={(by) => onChange(move(rows, i, by))}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_12rem_auto] lg:items-end">
              <div className="space-y-1.5">
                <Label htmlFor={`${base}-en`}>Label (English)</Label>
                <Input
                  id={`${base}-en`}
                  value={tile.labelEn}
                  maxLength={MAX_LABEL}
                  onChange={(e) => set(i, { labelEn: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`${base}-bn`}>Label (Bangla)</Label>
                <Input
                  id={`${base}-bn`}
                  lang="bn"
                  value={tile.labelBn}
                  maxLength={MAX_LABEL}
                  onChange={(e) => set(i, { labelBn: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`${base}-icon`}>Icon</Label>
                <Select value={tile.icon} onValueChange={(icon) => set(i, { icon })}>
                  <SelectTrigger id={`${base}-icon`} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {icons.map((name) => {
                      const Icon = contentIcon(name);
                      return (
                        <SelectItem key={name} value={name}>
                          <Icon aria-hidden />
                          {name}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex h-10 items-center gap-2">
                <Switch
                  id={`${base}-visible`}
                  checked={tile.visible}
                  onCheckedChange={(visible) => set(i, { visible })}
                />
                <Label htmlFor={`${base}-visible`}>Shown</Label>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
