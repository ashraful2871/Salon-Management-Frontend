"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ResponsiveDialog } from "@/components/Shared/ResponsiveDialog";
import { addPayoutAccount } from "@/services/owner/addPayoutAccount";
import { sendPayoutAccountCode } from "@/services/owner/sendPayoutAccountCode";
import {
  ACCOUNT_TYPE_LABEL,
  type AddPayoutAccountInput,
  type PayoutAccountType,
} from "@/services/owner/payoutAccountTypes";

// Same rules as the API's zod schema (owner.validation.ts).
const WALLET = /^01[3-9]\d{8}$/;
const ROUTING = /^\d{9}$/;
const ACCOUNT = /^\d{6,20}$/;

type Fields = {
  accountName: string;
  walletNumber: string;
  bankName: string;
  branchName: string;
  routingNumber: string;
  accountNumber: string;
};

const EMPTY: Fields = {
  accountName: "",
  walletNumber: "",
  bankName: "",
  branchName: "",
  routingNumber: "",
  accountNumber: "",
};

const digits = (value: string) => value.replace(/\D/g, "");

/** The first problem with the form, or null when it can be sent. */
const problem = (type: PayoutAccountType, f: Fields): string | null => {
  if (f.accountName.trim().length < 2) return "Enter the account holder's name.";
  if (type !== "BANK") {
    return WALLET.test(f.walletNumber) ? null : "Enter an 11-digit number starting 01.";
  }
  if (f.bankName.trim().length < 2) return "Enter the bank name.";
  if (f.branchName.trim().length < 2) return "Enter the branch.";
  if (!ROUTING.test(f.routingNumber)) return "The routing number is 9 digits.";
  if (!ACCOUNT.test(f.accountNumber)) return "The account number is 6 to 20 digits.";
  return null;
};

function CodeInput({
  id,
  value,
  onChange,
  disabled,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <InputOTP
      id={id}
      maxLength={6}
      inputMode="numeric"
      pattern={REGEXP_ONLY_DIGITS}
      autoComplete="one-time-code"
      value={value}
      onChange={onChange}
      disabled={disabled}
    >
      <InputOTPGroup>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <InputOTPSlot key={i} index={i} />
        ))}
      </InputOTPGroup>
    </InputOTP>
  );
}

/**
 * Add or change the payout account: type, details, then the 6-digit code we
 * email (and the authenticator code when 2FA is on). Finance verifies it
 * before any money goes there.
 */
export function AddPayoutAccountDialog({
  open,
  onOpenChange,
  codeEmail,
  totpRequired,
  cooldownHours,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  codeEmail: string;
  totpRequired: boolean;
  /** Hours a change waits before payouts use it; 0 for a first account. */
  cooldownHours: number;
}) {
  const ids = useId();
  const [type, setType] = useState<PayoutAccountType>("BKASH");
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [code, setCode] = useState("");
  const [totp, setTotp] = useState("");
  const [codeSentTo, setCodeSentTo] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [sending, startSending] = useTransition();
  const [saving, startSaving] = useTransition();

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const set = (key: keyof Fields, value: string) => {
    setFields((f) => ({ ...f, [key]: value }));
    setError(null);
  };

  const formProblem = problem(type, fields);
  const ready =
    !formProblem && !!codeSentTo && code.length === 6 && (!totpRequired || totp.length === 6);

  const sendCode = () =>
    startSending(async () => {
      setError(null);
      const result = await sendPayoutAccountCode();
      if (!result.success) {
        const wait = Number(result.details?.retryAfter ?? 0);
        if (wait > 0) setResendIn(wait);
        setError(result.message);
        return;
      }
      setCodeSentTo(result.data?.maskedEmail ?? codeEmail);
      setResendIn(60);
      setCode("");
    });

  const submit = () => {
    if (formProblem) {
      setError(formProblem);
      return;
    }
    if (!ready) return;
    const base = { accountName: fields.accountName.trim(), code, ...(totpRequired ? { totp } : {}) };
    const input: AddPayoutAccountInput =
      type === "BANK"
        ? {
            ...base,
            type,
            bankName: fields.bankName.trim(),
            branchName: fields.branchName.trim(),
            routingNumber: fields.routingNumber,
            accountNumber: fields.accountNumber,
          }
        : { ...base, type, walletNumber: fields.walletNumber };

    startSaving(async () => {
      setError(null);
      const result = await addPayoutAccount(input);
      if (!result.success) {
        setError(result.message);
        if (result.errorCode === "OTP_LOCKED" || result.errorCode === "OTP_EXPIRED" || result.errorCode === "OTP_NONE") {
          setCode("");
        }
        return;
      }
      toast.success("Account added. We'll email you when it's verified.");
      onOpenChange(false);
    });
  };

  const busy = sending || saving;

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(next) => !busy && onOpenChange(next)}
      title="Add payout account"
      description={
        cooldownHours > 0
          ? `For your safety, payouts keep going to your current account for ${cooldownHours} hours after a change.`
          : "Our finance team verifies it before the first payout."
      }
      footer={
        <>
          <Button variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!ready || busy} onClick={submit}>
            {saving && <Loader2 className="animate-spin" aria-hidden />}
            Add account
          </Button>
        </>
      }
    >
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="space-y-2">
          <Label id={`${ids}-type`}>Paid by</Label>
          <ToggleGroup
            type="single"
            spacing={2}
            value={type}
            onValueChange={(value) => {
              if (!value) return;
              setType(value as PayoutAccountType);
              setError(null);
            }}
            aria-labelledby={`${ids}-type`}
            className="flex flex-wrap gap-2"
          >
            {(Object.keys(ACCOUNT_TYPE_LABEL) as PayoutAccountType[]).map((t) => (
              <ToggleGroupItem
                key={t}
                value={t}
                className="h-9 rounded-full border border-border bg-surface px-4 text-sm font-medium data-[state=on]:border-primary/40 data-[state=on]:bg-primary-soft data-[state=on]:text-primary-hover"
              >
                {ACCOUNT_TYPE_LABEL[t]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${ids}-name`}>Account holder&apos;s name</Label>
          <Input
            id={`${ids}-name`}
            value={fields.accountName}
            onChange={(e) => set("accountName", e.target.value)}
            autoComplete="name"
            maxLength={120}
          />
        </div>

        {type === "BANK" ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`${ids}-bank`}>Bank</Label>
                <Input
                  id={`${ids}-bank`}
                  value={fields.bankName}
                  onChange={(e) => set("bankName", e.target.value)}
                  placeholder="e.g. Dutch-Bangla Bank"
                  maxLength={120}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${ids}-branch`}>Branch</Label>
                <Input
                  id={`${ids}-branch`}
                  value={fields.branchName}
                  onChange={(e) => set("branchName", e.target.value)}
                  maxLength={120}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`${ids}-routing`}>Routing number</Label>
                <Input
                  id={`${ids}-routing`}
                  inputMode="numeric"
                  value={fields.routingNumber}
                  onChange={(e) => set("routingNumber", digits(e.target.value).slice(0, 9))}
                  placeholder="9 digits"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${ids}-account`}>Account number</Label>
                <Input
                  id={`${ids}-account`}
                  inputMode="numeric"
                  autoComplete="off"
                  value={fields.accountNumber}
                  onChange={(e) => set("accountNumber", digits(e.target.value).slice(0, 20))}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <Label htmlFor={`${ids}-wallet`}>{ACCOUNT_TYPE_LABEL[type]} number</Label>
            <Input
              id={`${ids}-wallet`}
              inputMode="numeric"
              autoComplete="tel-national"
              value={fields.walletNumber}
              onChange={(e) => set("walletNumber", digits(e.target.value).slice(0, 11))}
              placeholder="01XXXXXXXXX"
            />
            <p className="text-xs text-muted-foreground">A personal or merchant wallet in the holder&apos;s name.</p>
          </div>
        )}

        <div className="space-y-2 rounded-xl border border-border bg-surface-subtle p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label htmlFor={`${ids}-code`}>Email code</Label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={sending || resendIn > 0}
              onClick={sendCode}
            >
              {sending && <Loader2 className="animate-spin" aria-hidden />}
              {codeSentTo ? (resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code") : "Send code"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {codeSentTo ? `We sent a 6-digit code to ${codeSentTo}.` : `We'll email a 6-digit code to ${codeEmail}.`}
          </p>
          {codeSentTo && (
            <CodeInput id={`${ids}-code`} value={code} onChange={setCode} disabled={saving} />
          )}
          {totpRequired && codeSentTo && (
            <div className="space-y-2 pt-2">
              <Label htmlFor={`${ids}-totp`}>Authenticator app code</Label>
              <CodeInput id={`${ids}-totp`} value={totp} onChange={setTotp} disabled={saving} />
            </div>
          )}
        </div>

        <div aria-live="polite">
          {error && <p className="text-sm text-danger">{error}</p>}
        </div>
        <button type="submit" hidden />
      </form>
    </ResponsiveDialog>
  );
}
