import PaymentResult from "@/components/Wallet/PaymentResult";

export const metadata = {
  title: "Payment failed | SalonKhuji",
};

export const dynamic = "force-dynamic";

const one = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

/** Where SSLCommerz sends the customer when the payment did not go through. */
const PaymentFailedPage = async ({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) => {
  const tran = one((await searchParams).tran);

  return <PaymentResult outcome="failed" transactionId={tran} />;
};

export default PaymentFailedPage;
