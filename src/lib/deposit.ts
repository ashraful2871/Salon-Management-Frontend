/**
 * A read-only mirror of `resolveDepositMinor` in
 * `Salon-Management-Server/src/app/modules/Appointment/appointment.deposit.ts`.
 *
 * The server stays the authority: it recomputes the deposit inside the booking
 * transaction and freezes its own figure onto the appointment. This copy exists
 * only so the review page can show the customer what will be held *before* they
 * commit. If the platform band or the percent-wins rule changes on the backend,
 * change it here too or the review page will quote a number the server will not
 * honour.
 */

/** Platform bounds. A salon sets its own policy, but not outside these. */
export const PLATFORM_MIN_DEPOSIT_MINOR = 2000; // BDT 20
export const PLATFORM_MAX_DEPOSIT_MINOR = 50000; // BDT 500

export type DepositPolicy = {
  depositMinor?: number | null;
  depositPercent?: number | null;
};

export const resolveDepositMinor = (
  salon: DepositPolicy,
  servicePriceMinor: number,
): number => {
  if (!servicePriceMinor || servicePriceMinor <= 0) return 0;

  const raw =
    salon.depositPercent != null
      ? Math.round((servicePriceMinor * salon.depositPercent) / 100)
      : (salon.depositMinor ?? 0);

  if (raw <= 0) return 0;

  const clamped = Math.min(
    Math.max(raw, PLATFORM_MIN_DEPOSIT_MINOR),
    PLATFORM_MAX_DEPOSIT_MINOR,
  );

  // A deposit larger than the bill is never what anyone meant.
  return Math.min(clamped, servicePriceMinor);
};
