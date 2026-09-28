"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, Wallet } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import PaymentMethodPicker from "@/components/Wallet/PaymentMethodPicker";
import { formatBDT } from "@/lib/money";
import {
  providerLabel,
  TOPUP_METHOD_KEY,
  type ProviderId,
} from "@/lib/payment-providers";
import type { Block } from "@/lib/assistant-types";
import {
  getPaymentMethods,
  type PaymentMethodOption,
} from "@/services/payments/getPaymentMethods";
import Chip from "../Chip";

type PaymentPromptBlock = Extract<Block, { type: "payment_prompt" }>;

export type StartTopup = (
  amountMinor: number,
  autoConfirm: boolean,
  label: string,
  provider?: ProviderId,
) => void;

/**
 * - `loading`: asking `GET /payments/methods`.
 * - `ready`: at least one gateway is on; the customer picks one.
 * - `none`: the API answered and every gateway is off.
 * - `unknown`: the list could not be read. The card still works: the tap goes
 *   without a provider and the API uses its default, as it did before the
 *   chat offered a choice.
 */
type MethodsState =
  | { status: "loading" }
  | { status: "ready"; methods: PaymentMethodOption[] }
  | { status: "none" }
  | { status: "unknown" };

const readSavedMethod = (): string | null => {
  try {
    return window.localStorage.getItem(TOPUP_METHOD_KEY);
  } catch {
    return null;
  }
};

const saveMethod = (id: ProviderId) => {
  try {
    window.localStorage.setItem(TOPUP_METHOD_KEY, id);
  } catch {
    // Private mode or blocked storage: the choice just isn't remembered.
  }
};

/**
 * The top-up card. Every figure is a `*Minor` field through `formatBDT` — the
 * taka twins are never shown.
 *
 * "Top up & book" is one decision covering both steps, and the only thing that
 * lets the server finish the booking when the money lands; "Top up only" comes
 * back to the summary for a second tap. The amounts on offer all cover the
 * shortfall, so neither button can leave the booking still short.
 *
 * The gateway list is the wallet dialog's (`GET /payments/methods`, uncached),
 * and the choice is remembered in the same `sm_topup_method` key, so a customer
 * who paid by bKash in one place finds bKash preselected in the other.
 */
const PaymentPrompt = ({
  block,
  disabled,
  onTopup,
  toppingUp = false,
}: {
  block: PaymentPromptBlock;
  disabled: boolean;
  /** Absent outside the panel, which keeps a reused card inert. */
  onTopup?: StartTopup;
  toppingUp?: boolean;
}) => {
  const presets =
    Array.isArray(block.presets) && block.presets.length > 0
      ? block.presets
      : [block.suggestedTopupMinor];
  const [amountMinor, setAmountMinor] = useState(block.suggestedTopupMinor);
  const [methodsState, setMethodsState] = useState<MethodsState>({
    status: "loading",
  });
  const [method, setMethod] = useState<ProviderId | null>(null);

  // Once per card, not per render: `disabled` flips on every tap in the chat,
  // and the list should not blink out and back each time it does.
  const tappable = Boolean(onTopup);
  useEffect(() => {
    if (!tappable) return;
    let cancelled = false;
    getPaymentMethods().then((res) => {
      if (cancelled) return;
      if (!res.success) {
        setMethodsState({ status: "unknown" });
        return;
      }
      const enabled = (res.data ?? []).filter((m) => m.enabled);
      if (enabled.length === 0) {
        setMethodsState({ status: "none" });
        return;
      }
      const saved = readSavedMethod();
      setMethod(
        enabled.find((m) => m.id === saved)?.id ?? enabled[0].id,
      );
      setMethodsState({ status: "ready", methods: enabled });
    });
    return () => {
      cancelled = true;
    };
  }, [tappable]);

  const selected =
    methodsState.status === "ready"
      ? (methodsState.methods.find((m) => m.id === method) ?? null)
      : null;

  const inert =
    disabled ||
    toppingUp ||
    !onTopup ||
    methodsState.status === "loading" ||
    methodsState.status === "none" ||
    (methodsState.status === "ready" && !selected);

  const amount = formatBDT(amountMinor);
  const shortfall = block.shortfallMinor;
  const minimum = formatBDT(block.minTopupMinor);
  const via = selected ? ` with ${providerLabel(selected.id)}` : "";

  // A ৳30 gap still means a ৳100 top-up. Said plainly, so the figure on the
  // button does not read like a mistake.
  const lead =
    shortfall <= 0
      ? `Add money to your wallet. The smallest top-up is ${minimum}.`
      : shortfall < block.minTopupMinor
        ? `You need ${formatBDT(shortfall)} more. The smallest top-up is ${minimum} — the rest stays in your wallet for next time.`
        : `You need ${formatBDT(shortfall)} more for the deposit.`;

  const autoConfirm = block.canAutoConfirm;

  const start = (book: boolean, label: string) => {
    const provider = selected?.id;
    if (provider) saveMethod(provider);
    onTopup?.(amountMinor, book, label, provider);
  };

  const gatewayPage =
    selected?.id === "BKASH"
      ? "the bKash page"
      : selected?.id === "SSLCOMMERZ"
        ? "the secure SSLCommerz page"
        : "the payment page";

  return (
    <div className="rounded-xl border border-gold/40 bg-gold/5 p-3.5">
      <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Wallet className="h-4 w-4 shrink-0 text-gold" aria-hidden />
        Top up your wallet
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        {lead}
      </p>

      {presets.length > 1 && (
        <div
          role="group"
          aria-label="Top-up amount"
          className="mt-3 flex flex-wrap gap-2"
        >
          {presets.map((preset) => (
            <Chip
              key={preset}
              label={formatBDT(preset)}
              selected={preset === amountMinor}
              disabled={disabled || toppingUp || !onTopup}
              onClick={() => setAmountMinor(preset)}
            />
          ))}
        </div>
      )}

      {tappable && methodsState.status !== "unknown" && (
        <div className="mt-3.5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Pay with
          </p>

          {methodsState.status === "loading" && (
            <div className="grid gap-2" aria-busy="true">
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          )}

          {methodsState.status === "none" && (
            <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
              Online top-up is unavailable right now. Please try again later.
            </p>
          )}

          {methodsState.status === "ready" && (
            <PaymentMethodPicker
              methods={methodsState.methods}
              value={method}
              onChange={setMethod}
              disabled={disabled || toppingUp}
              compact
            />
          )}
        </div>
      )}

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {autoConfirm ? (
          <>
            <Chip
              label={toppingUp ? "Opening…" : `Top up & book ${amount}${via}`}
              icon="wallet"
              style="primary"
              disabled={inert}
              onClick={() => start(true, `Top up & book ${amount}${via}`)}
              className="flex-1"
            />
            <Chip
              label="Top up only"
              disabled={inert}
              onClick={() => start(false, `Top up ${amount}${via}`)}
            />
          </>
        ) : (
          <Chip
            label={toppingUp ? "Opening…" : `Top up ${amount}${via}`}
            icon="wallet"
            style="primary"
            disabled={inert}
            onClick={() => start(false, `Top up ${amount}${via}`)}
            className="flex-1"
          />
        )}
      </div>

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        {autoConfirm
          ? `You will pay on ${gatewayPage}, then come back here and your booking finishes by itself.`
          : `You will pay on ${gatewayPage}, then come back here.`}
      </p>

      {selected?.testMode && (
        <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground/80">
          {selected.id === "BKASH"
            ? "Test mode: no real money moves. Use test wallet 01770618575, OTP 123456, PIN 12121."
            : "Test mode: use SSLCommerz test cards."}
        </p>
      )}

      {/* With the picker showing, the gateways speak for themselves; the
          server's list of brands is the fallback when it could not load. */}
      {!selected && block.methods?.length > 0 && (
        <p className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {block.methods.map((m) => (
            <span
              key={m}
              className="rounded-full border border-border bg-background px-2 py-0.5"
            >
              {m}
            </span>
          ))}
        </p>
      )}
    </div>
  );
};

export default PaymentPrompt;
