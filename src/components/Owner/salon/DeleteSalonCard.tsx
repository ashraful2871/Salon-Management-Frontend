"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveDialog } from "@/components/Shared/ResponsiveDialog";
import { showResultToast } from "@/components/Shared/showResultToast";
import { deleteSalon } from "@/services/salon/deleteSalon";

/**
 * Owner-only danger zone on Manage salon: type the salon's name to delete it.
 * The API refuses while customers still have upcoming or active home bookings
 * here, and says how many; that message is shown in the dialog.
 */
export function DeleteSalonCard({ salon }: { salon: { id: string; name: string } }) {
  const ids = useId();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const matches = typed.trim().toLowerCase() === salon.name.trim().toLowerCase();

  const openDialog = () => {
    setTyped("");
    setError(null);
    setOpen(true);
  };

  const submit = () => {
    if (!matches || pending) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteSalon(salon.id, typed.trim());
      if (!result.success) {
        setError(result.message);
        return;
      }
      showResultToast(result, "Salon deleted");
      setOpen(false);
      router.replace("/dashboard/store");
    });
  };

  return (
    <>
      <Card className="border-danger/30">
        <CardHeader>
          <CardTitle className="text-danger">Delete salon</CardTitle>
          <CardDescription>
            Removes {salon.name} from the site and your dashboard. Past bookings, reviews and money records are kept.
            Finish or cancel upcoming bookings first.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" className="text-white" onClick={openDialog}>
            <Trash2 />
            Delete this salon
          </Button>
        </CardContent>
      </Card>

      <ResponsiveDialog
        open={open}
        onOpenChange={(next) => !pending && setOpen(next)}
        title={`Delete ${salon.name}?`}
        description="This can't be undone from your dashboard. Customers can no longer find or book it."
        footer={
          <>
            <Button variant="outline" disabled={pending} onClick={() => setOpen(false)}>
              Keep it
            </Button>
            <Button
              variant="destructive"
              className="text-white"
              disabled={!matches || pending}
              onClick={submit}
            >
              {pending && <Loader2 aria-hidden className="animate-spin" />}
              Delete salon
            </Button>
          </>
        }
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor={`${ids}-name`}>
              Type <span className="font-semibold">{salon.name}</span> to confirm
            </Label>
            <Input
              id={`${ids}-name`}
              autoComplete="off"
              value={typed}
              disabled={pending}
              onChange={(e) => setTyped(e.target.value)}
            />
          </div>
          {error && (
            <p role="alert" className="rounded-xl border border-danger/30 bg-danger-soft p-3 text-sm text-danger">
              {error}
            </p>
          )}
        </form>
      </ResponsiveDialog>
    </>
  );
}
