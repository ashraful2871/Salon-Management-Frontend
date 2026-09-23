import type { AssistantAction } from "@/lib/assistant-types";

/** `label` is what the chip said; the API keeps it as the customer's own
 *  message, and the widget shows it as an optimistic bubble meanwhile. */
export type SendAction = (action: AssistantAction, label?: string) => void;

export type BlockProps<TBlock> = {
  block: TBlock;
  /** A turn is already in flight: every control in the transcript is inert. */
  disabled: boolean;
  /** The answer this question got, if it has been answered - marks the chip
   *  `aria-pressed` when the customer scrolls back through the transcript. */
  chosen?: string;
  onAction: SendAction;
};
