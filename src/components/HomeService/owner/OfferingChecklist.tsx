import { formatBDT } from "@/lib/money";
import type { HomeOffering } from "@/services/home-service/types";

/** The services an expert does. The caller passes only the expert's side. */
export function OfferingChecklist({
  offerings,
  selected,
  onChange,
}: {
  offerings: HomeOffering[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  if (offerings.length === 0) {
    return <p className="text-sm text-muted-foreground">Add services for this side in the Menu first.</p>;
  }

  return (
    <ul className="max-h-56 divide-y divide-border overflow-y-auto rounded-xl border border-border">
      {offerings.map((o) => (
        <li key={o.id}>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-muted/50">
            <input
              type="checkbox"
              className="size-4 shrink-0 accent-primary"
              checked={selected.includes(o.id)}
              onChange={(e) =>
                onChange(e.target.checked ? [...selected, o.id] : selected.filter((id) => id !== o.id))
              }
            />
            <span className="min-w-0 flex-1 truncate">{o.name}</span>
            <span className="shrink-0 text-muted-foreground">{formatBDT(o.priceMinor)}</span>
          </label>
        </li>
      ))}
    </ul>
  );
}
