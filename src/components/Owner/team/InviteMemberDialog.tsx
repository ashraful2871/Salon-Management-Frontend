"use client";

import { useId, useState, useTransition } from "react";
import { toast } from "sonner";
import { Copy } from "lucide-react";
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
import { ResponsiveDialog } from "@/components/Shared/ResponsiveDialog";
import { inviteMember } from "@/services/team/inviteMember";
import { ROLE_LABEL, type BranchRole } from "@/services/team/team-types";

const ROLE_HINT: Record<BranchRole, string> = {
  MANAGER: "Runs the branch: bookings, slots, services, team (not money).",
  RECEPTIONIST: "Runs the desk: bookings, walk-ins and customers.",
  STYLIST: "Sees and works their own bookings.",
};

/**
 * Invite someone to a branch by email. `roles` is what the inviter may hand
 * out (a manager: receptionist and stylist only); the API checks it again.
 * When the email could not be sent, the link is shown to pass on by hand.
 */
export function InviteMemberDialog({
  open,
  onOpenChange,
  salonId,
  salonName,
  roles,
  defaultRole = "STYLIST",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salonId: string;
  salonName?: string;
  roles: BranchRole[];
  defaultRole?: BranchRole;
}) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<BranchRole>(roles.includes(defaultRole) ? defaultRole : roles[0]);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const reset = () => {
    setEmail("");
    setName("");
    setRole(roles.includes(defaultRole) ? defaultRole : roles[0]);
    setError(null);
    setLink(null);
  };

  const change = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await inviteMember(salonId, { email: email.trim(), name, role });
      if (!result.success) {
        setError(result.message);
        return;
      }
      if (result.data?.inviteUrl) {
        // The email failed; the inviter passes the link on themselves.
        setLink(result.data.inviteUrl);
        return;
      }
      toast.success(`Invitation sent to ${email.trim()}`);
      change(false);
    });
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={change}
      title="Invite to the team"
      description={
        salonName ? `They'll join ${salonName} once they accept.` : "They'll join once they accept."
      }
    >
      {link ? (
        <div className="space-y-3">
          <p className="text-sm">
            The invitation was created, but the email didn&apos;t go out. Send this link to{" "}
            <span className="font-medium">{email}</span> yourself:
          </p>
          <div className="flex items-center gap-2">
            <Input readOnly value={link} aria-label="Invitation link" className="min-w-0 flex-1" />
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Copy link"
              onClick={() => {
                navigator.clipboard?.writeText(link).then(
                  () => toast.success("Link copied"),
                  () => toast.error("Couldn't copy. Select the link and copy it."),
                );
              }}
            >
              <Copy />
            </Button>
          </div>
          <Button type="button" className="w-full rounded-full" onClick={() => change(false)}>
            Done
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor={`${id}-email`}>Email</Label>
            <Input
              id={`${id}-email`}
              type="email"
              required
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${id}-name`}>
              Name <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id={`${id}-name`}
              value={name}
              maxLength={100}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${id}-role`}>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as BranchRole)}>
              <SelectTrigger id={`${id}-role`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABEL[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{ROLE_HINT[role]}</p>
          </div>
          <p aria-live="polite" className="min-h-5 text-sm font-medium text-destructive">
            {error}
          </p>
          <Button type="submit" loading={pending} className="w-full rounded-full font-bold">
            Send invitation
          </Button>
        </form>
      )}
    </ResponsiveDialog>
  );
}
