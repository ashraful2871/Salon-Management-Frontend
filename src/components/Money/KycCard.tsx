"use client";

import { useId, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToneBadge } from "@/components/Shared/ToneBadge";
import { updateKyc } from "@/services/owner/updateKyc";
import type { KycStatus, OwnerKyc } from "@/services/owner/payoutAccountTypes";

const STATUS_LABEL: Record<KycStatus, string> = {
  NONE: "Not submitted",
  SUBMITTED: "Under review",
  VERIFIED: "Verified",
  REJECTED: "Needs changes",
};

const digits = (value: string) => value.replace(/\D/g, "");

/** Legal name, trade licence, TIN/BIN and the NID's last 4 digits. */
export function KycCard({ kyc }: { kyc: OwnerKyc }) {
  const ids = useId();
  const [form, setForm] = useState({
    legalName: kyc.legalName ?? "",
    tradeLicenseNo: kyc.tradeLicenseNo ?? "",
    tin: kyc.tin ?? "",
    bin: kyc.bin ?? "",
    nidLast4: kyc.nidLast4 ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const set = (key: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setError(null);
  };

  const problem =
    form.legalName.trim().length < 2
      ? "Enter the business's legal name."
      : form.tradeLicenseNo.trim().length < 3
        ? "Enter the trade licence number."
        : form.tin && form.tin.length !== 12
          ? "The TIN is 12 digits."
          : form.bin && (form.bin.length < 9 || form.bin.length > 13)
            ? "The BIN is 9 to 13 digits."
            : form.nidLast4.length !== 4
              ? "Enter the last 4 digits of the NID."
              : null;

  const submit = () => {
    if (problem) {
      setError(problem);
      return;
    }
    startTransition(async () => {
      const result = await updateKyc({
        legalName: form.legalName.trim(),
        tradeLicenseNo: form.tradeLicenseNo.trim(),
        tin: form.tin || undefined,
        bin: form.bin || undefined,
        nidLast4: form.nidLast4,
      });
      if (!result.success) {
        setError(result.message);
        return;
      }
      toast.success("Business details sent for verification");
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business details</CardTitle>
        <CardDescription>Needed for payouts and tax records. Only Finance sees these.</CardDescription>
        <CardAction>
          <ToneBadge status={kyc.status}>{STATUS_LABEL[kyc.status]}</ToneBadge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          {kyc.status === "REJECTED" && kyc.note && (
            <p className="rounded-xl bg-danger-soft p-3 text-sm text-danger">Reason: {kyc.note}</p>
          )}
          <div className="space-y-2">
            <Label htmlFor={`${ids}-legal`}>Legal business name</Label>
            <Input
              id={`${ids}-legal`}
              value={form.legalName}
              onChange={(e) => set("legalName", e.target.value)}
              maxLength={160}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${ids}-licence`}>Trade licence number</Label>
            <Input
              id={`${ids}-licence`}
              value={form.tradeLicenseNo}
              onChange={(e) => set("tradeLicenseNo", e.target.value)}
              maxLength={60}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`${ids}-tin`}>TIN (optional)</Label>
              <Input
                id={`${ids}-tin`}
                inputMode="numeric"
                value={form.tin}
                onChange={(e) => set("tin", digits(e.target.value).slice(0, 12))}
                placeholder="12 digits"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${ids}-bin`}>BIN (optional)</Label>
              <Input
                id={`${ids}-bin`}
                inputMode="numeric"
                value={form.bin}
                onChange={(e) => set("bin", digits(e.target.value).slice(0, 13))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${ids}-nid`}>Owner&apos;s NID, last 4 digits</Label>
            <Input
              id={`${ids}-nid`}
              inputMode="numeric"
              autoComplete="off"
              className="max-w-32"
              value={form.nidLast4}
              onChange={(e) => set("nidLast4", digits(e.target.value).slice(0, 4))}
            />
            <p className="text-xs text-muted-foreground">We never store the full NID number.</p>
          </div>
          <div aria-live="polite">{error && <p className="text-sm text-danger">{error}</p>}</div>
          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" aria-hidden />}
              {kyc.status === "NONE" ? "Submit for verification" : "Save and resubmit"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
