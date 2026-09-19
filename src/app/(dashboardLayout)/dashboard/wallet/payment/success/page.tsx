import PaymentResult from "@/components/Wallet/PaymentResult";

export const metadata = {
  title: "Payment successful | SalonKhuji",
};

export const dynamic = "force-dynamic";

const one = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

/**
 * Where SSLCommerz sends the customer after a completed payment. The page never
 * credits anything itself - it polls the intent until the backend has settled
 * it, so what it shows is the ledger's own answer.
 */
const PaymentSuccessPage = async ({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) => {
  const tran = one((await searchParams).tran);

  return <PaymentResult outcome="success" transactionId={tran} />;
};

export default PaymentSuccessPage;
