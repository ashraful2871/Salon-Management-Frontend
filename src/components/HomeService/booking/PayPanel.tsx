"use client";

import { useState } from "react";
import { Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";

import PaymentMethodPicker from "@/components/Wallet/PaymentMethodPicker";
import { Button } from "@/components/ui/button";
import { formatBDT } from "@/lib/money";
import { providerLabel, type ProviderId } from "@/lib/payment-providers";
import { track } from "@/lib/track";
import type { PaymentMethodOption } from "@/services/payments/getPaymentMethods";
import { payHomeBooking } from "@/services/home-service/payHomeBooking";
import type { HomeAudience, HomeBooking } from "@/services/home-service/types";
import { trackSide } from "../content";
import { homeErrorMessage } from "./errors";

/** What the gateway is asked for: the shortfall rounded up to whole taka, at least ৳10 (the API's rule). */
export const shortfallOf = (advanceMinor: number, walletMinor: number) => {
  const short = advanceMinor - Math.max(0, walletMinor);
  return short <= 0 ? 0 : Math.max(1000, Math.ceil(short / 100) * 100);
};

export type HomePayOutcome =
  | { kind: "paid"; booking: HomeBooking }
  | { kind: "redirecting" }
  | { kind: "failed"; errorCode?: string };

/**
 * Pays a PENDING_PAYMENT visit: from the wallet when it covers the advance,
 * else the shortfall through the gateway (the browser leaves for it, and
 * `pending` stays on until it has).
 */
export function useHomePay() {
  const [pending, setPending] = useState(false);
  const pay = async (id: string, audience: HomeAudience, method: ProviderId | "WALLET"): Promise<HomePayOutcome> => {
    setPending(true);
    const res = await payHomeBooking(id, method, crypto.randomUUID());
    if (!res.success || !res.data) {
      setPending(false);
      toast.error(homeErrorMessage(res));
      return { kind: "failed", errorCode: res.errorCode };
    }
    if (res.data.status === "PENDING_PAYMENT") {
      window.location.assign(res.data.redirectUrl);
      return { kind: "redirecting" };
    }
    setPending(false);
    if (res.data.status === "CONFIRMED") track("home_booking_paid", `${trackSide(audience)},method:wallet`);
    return { kind: "paid", booking: res.data.booking };
  };
  return { pay, pending };
}

/**
 * The pay buttons: "Pay ৳X from wallet" when the wallet covers the advance,
 * else the gateway picker and "Pay ৳shortfall with …".
 */
export function PayPanel({
  advanceMinor,
  walletMinor,
  methods,
  initialMethod,
  disabled,
  pending,
  onPay,
  hint,
}: {
  advanceMinor: number;
  walletMinor: number;
  methods: PaymentMethodOption[];
  initialMethod?: ProviderId | null;
  disabled?: boolean;
  pending: boolean;
  onPay: (method: ProviderId | "WALLET") => void;
  /** Under the button, e.g. why it is disabled. */
  hint?: string | null;
}) {
  const enabled = methods.filter((m) => m.enabled);
  const [method, setMethod] = useState<ProviderId | null>(
    enabled.find((m) => m.id === initialMethod)?.id ?? enabled[0]?.id ?? null,
  );
  const shortfall = shortfallOf(advanceMinor, walletMinor);

  if (shortfall === 0) {
    return (
      <div className="space-y-2">
        <Button className="h-12 w-full text-base" disabled={disabled || pending} onClick={() => onPay("WALLET")}>
          {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Wallet aria-hidden />}
          Pay {formatBDT(advanceMinor)} from wallet
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          {hint || `Wallet balance ${formatBDT(walletMinor)}. The advance is held until the visit is done.`}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {walletMinor > 0
          ? `Your wallet has ${formatBDT(walletMinor)}. Add the rest to pay the advance:`
          : "Pay the advance with:"}
      </p>
      {enabled.length > 0 ? (
        <>
          <PaymentMethodPicker methods={methods} value={method} onChange={setMethod} disabled={pending} compact />
          {enabled.some((m) => m.testMode) && (
            <p className="text-xs text-muted-foreground">Test mode: no real money moves.</p>
          )}
          <Button
            className="h-12 w-full text-base"
            disabled={disabled || pending || !method}
            onClick={() => method && onPay(method)}
          >
            {pending && <Loader2 className="animate-spin" aria-hidden />}
            Pay {formatBDT(shortfall)} with {method === "SSLCOMMERZ" ? "card" : providerLabel(method)}
          </Button>
        </>
      ) : (
        <p className="text-sm text-danger">Online payment is unavailable right now. Please try again shortly.</p>
      )}
      {hint && <p className="text-center text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
