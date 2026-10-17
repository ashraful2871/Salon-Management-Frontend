import { cn } from "@/lib/utils";

/** The business's private tags on a customer, as small pills. */
export function TagChips({ tags, className }: { tags: string[]; className?: string }) {
  return (
    <ul className={cn("flex flex-wrap gap-1", className)} aria-label="Tags">
      {tags.map((tag) => (
        <li key={tag} className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">
          {tag}
        </li>
      ))}
    </ul>
  );
}
