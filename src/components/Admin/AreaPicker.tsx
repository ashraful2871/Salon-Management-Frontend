"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AreaOption } from "@/services/admin/agents/types";

export type AreaValue = { division: string; district: string; area: string };

const keyOf = (a: AreaValue) => `${a.division}|${a.district}|${a.area}`;

/**
 * An agent's area, picked from the places that have a salon (`GET /admin/areas`)
 * so it always matches what the salons say. A current value that no salon
 * uses any more still shows, so editing never silently changes it.
 */
export function AreaPicker({
  id,
  areas,
  value,
  onChange,
}: {
  id?: string;
  areas: AreaOption[];
  value: AreaValue | null;
  onChange: (value: AreaValue) => void;
}) {
  const options: AreaValue[] =
    value && !areas.some((a) => keyOf(a) === keyOf(value)) ? [value, ...areas] : areas;
  const counts = new Map(areas.map((a) => [keyOf(a), a.salons]));

  return (
    <Select
      value={value ? keyOf(value) : undefined}
      onValueChange={(key) => {
        const picked = options.find((a) => keyOf(a) === key);
        if (picked) onChange({ division: picked.division, district: picked.district, area: picked.area });
      }}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder={areas.length ? "Pick an area" : "No areas with salons yet"} />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {options.map((a) => (
          <SelectItem key={keyOf(a)} value={keyOf(a)}>
            {a.area}, {a.district}
            <span className="ml-1 text-xs text-muted-foreground">
              · {a.division}
              {counts.has(keyOf(a)) ? ` · ${counts.get(keyOf(a))} salons` : ""}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
