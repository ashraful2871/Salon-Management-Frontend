"use client";

import { useEffect, useState, useTransition } from "react";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PaymentMethodPicker from "@/components/Wallet/PaymentMethodPicker";
import { formatBDT } from "@/lib/money";
import { cn } from "@/lib/utils";
import { TONE_CLASSES } from "@/lib/status-tone";
import { BKASH_PINK, type ProviderId } from "@/lib/payment-providers";
import { getPaymentMethods, type PaymentMethodOption } from "@/services/payments/getPaymentMethods";
import { payDues } from "@/services/owner/payDues";
import type { OwnerDues } from "@/services/owner/money-types";

const day = (iso: string) => format(new Date(iso), "EEE d MMM");

/**
 * Money Overview's dues card: the amount, how old it is, the pause state and
 * "Pay with bKash" (two taps: here, then approve in bKash). The server decides
 * the amount; "Card / other" opens the compact method picker.
 */
export function DuesCard({ dues }: { dues: OwnerDues }) {
  const [methods, setMethods] = useState<PaymentMethodOption[] | null>(null);
  const [showOther, setShowOther] = useState(false);
  const [other, setOther] = useState<ProviderId | null>(null);
  const [pending, startTransition] = useTransition();
  const [paying, setPaying] = useState<ProviderId | null>(null);

  useEffect(() => {
    let cancelled = false;
    getPaymentMethods().then((res) => {
      if (!cancelled) setMethods(res.success ? (res.data ?? []).filter((m) => m.enabled) : []);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const canPay = dues.amountMinor >= dues.minPayMinor;
  const bkash = methods?.find((m) => m.id === "BKASH");
  const others = methods?.filter((m) => m.id !== "BKASH") ?? [];

  const pay = (provider: ProviderId) => {
    setPaying(provider);
    startTransition(async () => {
      const res = await payDues(provider);
      if (res.success && res.data?.redirectUrl) {
        window.location.href = res.data.redirectUrl;
        return;
      }
      setPaying(null);
      toast.error(res.message || "Could not start the payment.");
    });
  };

  return (
    <Card className={cn("gap-3", dues.paused && "border-danger/40")}>
      <CardHeader className="px-4 sm:px-6">
        <CardTitle>You owe {formatBDT(dues.amountMinor)}</CardTitle>
        <CardDescription>
          Commission on bookings paid at your counter is more than we hold for you
          {dues.since ? `, since ${day(dues.since)}` : ""}. It comes out of your next earnings,
          or you can pay it now.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 px-4 sm:px-6">
        {dues.paused ? (
          <p className={cn("rounded-lg px-3 py-2 text-sm", TONE_CLASSES.danger.soft, TONE_CLASSES.danger.text)}>
            Online bookings are paused{dues.pausedAt ? ` since ${day(dues.pausedAt)}` : ""}. They
            resume as soon as the dues are paid.
          </p>
        ) : dues.pauseAt ? (
          <p className={cn("rounded-lg px-3 py-2 text-sm", TONE_CLASSES.warning.soft, TONE_CLASSES.warning.text)}>
            Online bookings pause on {day(dues.pauseAt)} unless the dues are paid.
          </p>
        ) : null}

        {!canPay ? (
          <p className="text-sm text-muted-foreground">
            Under {formatBDT(dues.minPayMinor)} - it comes out of your next earnings.
          </p>
        ) : methods === null ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Loading payment methods…
          </p>
        ) : methods.length === 0 ? (
          <p className="text-sm text-muted-foreground">Online payment is not available right now.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              {bkash && (
                <Button
                  onClick={() => pay("BKASH")}
                  disabled={pending}
                  className="text-white hover:opacity-90"
                  style={{ backgroundColor: BKASH_PINK }}
                >
                  {paying === "BKASH" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                  Pay with bKash
                </Button>
              )}
              {others.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setShowOther((v) => !v)}
                  disabled={pending}
                  aria-expanded={showOther}
                >
                  Card / other
                </Button>
              )}
            </div>
            {showOther && others.length > 0 && (
              <div className="space-y-3">
                <PaymentMethodPicker
                  methods={others}
                  value={other}
                  onChange={setOther}
                  disabled={pending}
                  compact
                />
                <Button onClick={() => other && pay(other)} disabled={!other || pending}>
                  {paying && paying !== "BKASH" && (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  )}
                  Pay {formatBDT(dues.amountMinor)}
                </Button>
              </div>
            )}
            {methods.some((m) => m.testMode) && (
              <p className="text-xs text-muted-foreground">Test mode - no real money moves.</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
