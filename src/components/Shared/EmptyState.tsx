import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** What a list shows when it has nothing to list. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center py-12 text-center">
      {Icon && (
        <span className="mb-4 grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
          <Icon aria-hidden="true" className="size-6" />
        </span>
      )}
      <p className="font-semibold text-foreground">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
