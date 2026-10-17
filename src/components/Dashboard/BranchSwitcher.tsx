"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Store } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setSelectedBranch } from "@/lib/branch-cookie";
import { cn } from "@/lib/utils";

export type BranchOption = { salonId: string; salonName: string };

/**
 * The owner's "All branches / one branch" choice in the dashboard top bar.
 * Two or more branches: a select. One: its name as a label. None: nothing.
 * The choice lives in the `sm_branch` cookie, so after saving it the page is
 * refreshed to re-render its server components with the new branch.
 */
export function BranchSwitcher({
  branches,
  selected,
  allowAll = true,
}: {
  branches: BranchOption[];
  selected: string;
  /** False for a manager: they work one branch at a time, never "All branches". */
  allowAll?: boolean;
}) {
  const router = useRouter();
  // Shows the new choice while it saves; the server's value wins afterwards.
  const [value, setValue] = useOptimistic(selected);
  const [pending, startTransition] = useTransition();

  if (branches.length === 0) return null;

  if (branches.length === 1) {
    return (
      <span className="hidden max-w-[12rem] items-center gap-1.5 truncate text-sm font-medium text-muted-foreground sm:flex">
        <Store className="h-4 w-4 shrink-0" aria-hidden />
        <span className="truncate">{branches[0].salonName}</span>
      </span>
    );
  }

  const onChange = (next: string) => {
    startTransition(async () => {
      setValue(next);
      await setSelectedBranch(next);
      // Re-reads the cookie on the server; no data changed, so no tag to update.
      router.refresh();
    });
  };

  return (
    <Select value={value} onValueChange={onChange} disabled={pending}>
      <SelectTrigger
        aria-label="Branch"
        className={cn(
          "h-10 w-auto max-w-[10rem] shrink-0 gap-1.5 rounded-full sm:max-w-[14rem]",
          pending && "opacity-70",
        )}
      >
        <Store className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <SelectValue placeholder="Choose a branch" />
      </SelectTrigger>
      <SelectContent position="popper" align="end">
        {allowAll && <SelectItem value="all">All branches</SelectItem>}
        {branches.map((branch) => (
          <SelectItem key={branch.salonId} value={branch.salonId}>
            {branch.salonName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
