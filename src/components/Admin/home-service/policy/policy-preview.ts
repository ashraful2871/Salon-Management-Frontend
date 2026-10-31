import { previewOutcome, type HomePolicyWithText, type HomePreviewScenario } from "@/lib/home-policy";
import { formatBDT } from "@/lib/money";
import type { AdminSetting } from "@/services/admin/settings/types";

/** The visit the previews are priced on. */
export const SAMPLE_TOTAL_MINOR = 130_000;

/** The API's `ceil_to_taka(total × advancePercent / 100)`. */
export const sampleAdvance = (advancePercent: number) =>
  Math.ceil((SAMPLE_TOTAL_MINOR * advancePercent) / 100 / 100) * 100;

export type OutcomeRow = { label: string; customerMinor: number; salonMinor: number; platformMinor: number };

const SCENARIOS: { label: string; scenario: (p: HomePolicyWithText) => HomePreviewScenario }[] = [
  { label: "Cancel early", scenario: (p) => ({ kind: "CUSTOMER_CANCEL", hoursBefore: p.freeCancelHours + 24 }) },
  // On the way is late under every setting, even a 0 h window.
  { label: "Cancel late", scenario: () => ({ kind: "CUSTOMER_CANCEL", hoursBefore: 0.5, status: "EN_ROUTE" }) },
  { label: "No-show", scenario: () => ({ kind: "CUSTOMER_NO_SHOW" }) },
  { label: "Salon cancels", scenario: () => ({ kind: "SALON_CANCEL" }) },
];

/** Who ends up with what. The salon pays its cancel credit, and the customer receives it. */
export const outcomeRows = (policy: HomePolicyWithText, advanceMinor: number): OutcomeRow[] =>
  SCENARIOS.map(({ label, scenario }) => {
    const o = previewOutcome(policy, advanceMinor, scenario(policy));
    return {
      label,
      customerMinor: o.refundMinor + o.salonCreditMinor,
      salonMinor: o.salonShareMinor - o.salonCreditMinor,
      platformMinor: o.platformShareMinor,
    };
  });

/** Every key "Turn all fees off" puts back to its launch value. */
export const FEE_KEYS = [
  "homeService.customerCancelPolicy",
  "homeService.nonRefundableGraceMinutes",
  "homeService.commissionPercent",
  "homeService.lateCancelPercent",
  "homeService.noShowPercent",
  "homeService.salonCancelCreditMinor",
  "homeService.feeSalonSharePercent",
  "homeService.travelFeeMaxMinor",
];

/** The fees in force right now, for the banner. Empty means customers pay nothing beyond the visit. */
export const feesInForce = (policy: HomePolicyWithText, settings: AdminSetting[]) => {
  const number = (key: string) => Number(settings.find((s) => s.key === `homeService.${key}`)?.value ?? 0);
  const commission = number("commissionPercent");
  const travelMax = number("travelFeeMaxMinor");
  const fees: string[] = [];

  if (policy.policy === "WINDOW" && policy.lateCancelPercent > 0) {
    fees.push(`Late cancellation keeps ${policy.lateCancelPercent}% (free until ${policy.freeCancelHours} h before)`);
  }
  if (policy.policy === "NON_REFUNDABLE") {
    const g = policy.nonRefundableGraceMinutes;
    fees.push(`The advance is non-refundable${g > 0 ? ` after a ${g} minute grace` : ""}`);
  } else if (policy.noShowPercent > 0) {
    fees.push(`A no-show keeps ${policy.noShowPercent}%`);
  }
  if (commission > 0) fees.push(`Commission of ${commission}%`);
  if (policy.salonCancelCreditMinor > 0) {
    fees.push(`Salon cancel credit of ${formatBDT(policy.salonCancelCreditMinor)}`);
  }
  if (travelMax > 0) fees.push(`Branches can charge travel, up to ${formatBDT(travelMax)}`);
  return fees;
};
