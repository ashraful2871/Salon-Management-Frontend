"use client";

import type { Block } from "@/lib/assistant-types";
import type { SendAction } from "./block-props";
import BookingConfirmedCard from "./blocks/BookingConfirmedCard";
import ChatBookingSummary from "./blocks/ChatBookingSummary";
import CounterPicker from "./blocks/CounterPicker";
import DatePicker from "./blocks/DatePicker";
import LocationRequest from "./blocks/LocationRequest";
import LoginRequired from "./blocks/LoginRequired";
import Notice from "./blocks/Notice";
import PaymentPrompt, { type StartTopup } from "./blocks/PaymentPrompt";
import QuickReplies from "./blocks/QuickReplies";
import SalonCarousel from "./blocks/SalonCarousel";
import SalonDetails from "./blocks/SalonDetails";
import ServicePicker from "./blocks/ServicePicker";
import SlotPicker from "./blocks/SlotPicker";
import WalletStatus from "./blocks/WalletStatus";

type AssistantBlocksProps = {
  blocks: Block[] | null | undefined;
  disabled: boolean;
  /** What this question was answered with, so the chosen option can be marked. */
  chosen?: string;
  onAction: SendAction;
  /** Posts a signed quote to the confirm endpoint. Absent outside the panel,
   *  which is what keeps a summary card read-only wherever it is reused. */
  onConfirm?: (confirmToken: string) => void;
  confirming?: boolean;
  /** The token that already booked; its card shows "Booked" for good. */
  confirmedToken?: string | null;
  /** Opens the gateway for a top-up. Absent outside the panel, like
   *  `onConfirm`. */
  onTopup?: StartTopup;
  toppingUp?: boolean;
};

/**
 * The whole rendering contract: `type` picks a component, and anything this
 * build has never heard of renders as nothing. A backend that ships a new block
 * before the frontend knows it degrades to silence, never to a crash.
 */
const AssistantBlocks = ({
  blocks,
  disabled,
  chosen,
  onAction,
  onConfirm,
  confirming = false,
  confirmedToken = null,
  onTopup,
  toppingUp = false,
}: AssistantBlocksProps) => {
  if (!Array.isArray(blocks) || blocks.length === 0) return null;

  return (
    <div className="space-y-3">
      {blocks.map((block, i) => {
        const key = `${block?.type ?? "unknown"}-${i}`;
        const props = { disabled, chosen, onAction };

        switch (block?.type) {
          case "quick_replies":
            return <QuickReplies key={key} block={block} {...props} />;
          case "location_request":
            return <LocationRequest key={key} block={block} {...props} />;
          case "salon_carousel":
            return <SalonCarousel key={key} block={block} {...props} />;
          case "salon_details":
            return <SalonDetails key={key} block={block} {...props} />;
          case "wallet_status":
            return <WalletStatus key={key} block={block} />;
          case "date_picker":
            return <DatePicker key={key} block={block} {...props} />;
          case "service_picker":
            return <ServicePicker key={key} block={block} {...props} />;
          case "counter_picker":
            return <CounterPicker key={key} block={block} {...props} />;
          case "slot_picker":
            return <SlotPicker key={key} block={block} {...props} />;
          case "booking_summary":
            return (
              <ChatBookingSummary
                key={key}
                block={block}
                {...props}
                onConfirm={onConfirm}
                confirming={confirming}
                confirmed={
                  Boolean(block.confirmToken) &&
                  block.confirmToken === confirmedToken
                }
              />
            );
          case "booking_confirmed":
            return <BookingConfirmedCard key={key} block={block} />;
          case "payment_prompt":
            return (
              <PaymentPrompt
                key={key}
                block={block}
                disabled={disabled}
                onTopup={onTopup}
                toppingUp={toppingUp}
              />
            );
          case "login_required":
            return <LoginRequired key={key} block={block} />;
          case "notice":
            return <Notice key={key} block={block} />;
          default:
            return null;
        }
      })}
    </div>
  );
};

export default AssistantBlocks;
