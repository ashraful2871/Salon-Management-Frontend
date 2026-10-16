"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export type BranchOption = { id: string; name: string };

/**
 * A searchable list of branches with checkboxes and "Select all". Owners can
 * run hundreds of branches, so the list scrolls inside its own frame.
 */
export function BranchChecklist({
  branches,
  selected,
  onChange,
  idPrefix,
}: {
  branches: BranchOption[];
  selected: string[];
  onChange: (ids: string[]) => void;
  idPrefix: string;
}) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const visible = needle ? branches.filter((b) => b.name.toLowerCase().includes(needle)) : branches;
  const picked = new Set(selected);
  const allVisible = visible.length > 0 && visible.every((b) => picked.has(b.id));

  const toggleAll = () => {
    const next = new Set(picked);
    for (const b of visible) {
      if (allVisible) next.delete(b.id);
      else next.add(b.id);
    }
    onChange([...next]);
  };

  return (
    <div className="space-y-2">
      {branches.length > 8 && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a branch"
            className="pl-9"
            aria-label="Find a branch"
          />
        </div>
      )}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {selected.length} of {branches.length} selected
        </span>
        {visible.length > 0 && (
          <button type="button" onClick={toggleAll} className="font-medium text-primary hover:underline">
            {allVisible ? "Clear" : needle ? "Select shown" : "Select all"}
          </button>
        )}
      </div>
      <ul className="max-h-64 divide-y divide-border overflow-y-auto rounded-lg border border-border">
        {visible.map((b) => (
          <li key={b.id}>
            <label htmlFor={`${idPrefix}-${b.id}`} className="flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm hover:bg-muted/50">
              <input
                id={`${idPrefix}-${b.id}`}
                type="checkbox"
                className="size-4 accent-[var(--color-primary)]"
                checked={picked.has(b.id)}
                onChange={(e) => {
                  const next = new Set(picked);
                  if (e.target.checked) next.add(b.id);
                  else next.delete(b.id);
                  onChange([...next]);
                }}
              />
              <span className="min-w-0 truncate">{b.name}</span>
            </label>
          </li>
        ))}
        {visible.length === 0 && <li className="px-3 py-4 text-center text-sm text-muted-foreground">No branch matches.</li>}
      </ul>
    </div>
  );
}
