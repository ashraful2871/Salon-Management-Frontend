import PaymentResult from "@/components/Wallet/PaymentResult";
import { CHAT_RESUME_COOKIE } from "@/lib/assistant-request";
import { BOOKING_RESUME_COOKIE, bookingResumePath } from "@/lib/booking-resume";
import { getCookie } from "@/services/auth/cookiesHandler";

export const metadata = {
  title: "Payment cancelled",
};

export const dynamic = "force-dynamic";

const one = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

/** Where SSLCommerz sends the customer when they back out of the payment. */
const PaymentCancelledPage = async ({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) => {
  const tran = one((await searchParams).tran);

  // Set when the top-up was opened from the booking chat.
  const resumeChat = Boolean(await getCookie(CHAT_RESUME_COOKIE));
  // Set when it was opened from a booking review page.
  const resumeBooking = bookingResumePath(await getCookie(BOOKING_RESUME_COOKIE));

  return (
    <PaymentResult
      outcome="cancelled"
      transactionId={tran}
      resumeChat={resumeChat}
      resumeBooking={resumeBooking}
    />
  );
};

export default PaymentCancelledPage;
