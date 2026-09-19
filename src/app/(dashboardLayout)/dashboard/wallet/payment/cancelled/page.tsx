import PaymentResult from "@/components/Wallet/PaymentResult";

export const metadata = {
  title: "Payment cancelled | SalonKhuji",
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

  return <PaymentResult outcome="cancelled" transactionId={tran} />;
};

export default PaymentCancelledPage;
