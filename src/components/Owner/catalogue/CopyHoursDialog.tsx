"use client";

import { useState, useTransition } from "react";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/Shared/ResponsiveDialog";
import { showResultToast } from "@/components/Shared/showResultToast";
import { copyHoursToBranches } from "@/services/owner/catalogueActions";
import { BranchChecklist, type BranchOption } from "./BranchChecklist";

/** Hours tab: "Copy hours to…" other branches of the same owner (saved hours only). */
export function CopyHoursButton({
  fromSalonId,
  branches,
  disabled,
}: {
  fromSalonId: string;
  /** The owner's other branches. */
  branches: BranchOption[];
  /** True while the hours have unsaved edits: only saved hours are copied. */
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  if (!branches.length) return null;

  const submit = () =>
    startTransition(async () => {
      const res = await copyHoursToBranches({ fromSalonId, toSalonIds: selected });
      showResultToast(res, "Hours copied", "Couldn't copy the hours");
      if (res.success) {
        setSelected([]);
        setOpen(false);
      }
    });

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        disabled={disabled}
        title={disabled ? "Save your changes first" : undefined}
      >
        <Copy aria-hidden="true" />
        Copy hours to…
      </Button>
      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        title="Copy hours to other branches"
        description="Their weekly hours are replaced with this branch's saved hours."
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button onClick={submit} loading={pending} disabled={!selected.length}>
              Copy to {selected.length || ""} {selected.length === 1 ? "branch" : "branches"}
            </Button>
          </>
        }
      >
        <BranchChecklist branches={branches} selected={selected} onChange={setSelected} idPrefix="copy-hours" />
      </ResponsiveDialog>
    </>
  );
}
