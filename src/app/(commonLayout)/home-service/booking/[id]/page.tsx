import Link from "next/link";
import { redirect } from "next/navigation";
import { SearchX } from "lucide-react";

import HomeBookingView from "@/components/HomeService/booking/HomeBookingView";
import { EmptyState } from "@/components/Shared/EmptyState";
import { Button } from "@/components/ui/button";
import { homeBookingPath } from "@/lib/booking-resume";
import type { ProviderId } from "@/lib/payment-providers";
import { getUserRoles } from "@/services/get-roles/getUserRoles";
import { getHomeBooking } from "@/services/home-service/getHomeBooking";
import { ACTIVE_HOME_STATUSES } from "@/services/home-service/types";
import { getPaymentMethods } from "@/services/payments/getPaymentMethods";
import { getMyWallet } from "@/services/wallet/getMyWallet";

export const metadata = { title: "Your home visit" };

type SearchParams = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/**
 * /home-service/booking/[id]: one visit, from paying to done. Also where a
 * bKash / card trip comes back to (through the wallet result page and the
 * booking-resume cookie, `?via=bkash|sslcommerz`), and where "Try again"
 * reopens the pay panel (`?topup=1&method=`).
 */
export default async function HomeBookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const role = await getUserRoles();
  if (!role) redirect(`/login?redirect=${encodeURIComponent(homeBookingPath(id))}`);

  const res = await getHomeBooking(id);
  if (!res.success || !res.data) {
    return (
      <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <EmptyState
          icon={SearchX}
          title="We couldn't find this booking"
          description={/not found/i.test(res.message) ? "It may belong to another account." : res.message}
          action={
            <Button variant="outline" asChild>
              <Link href="/home-service">Back to Home Service</Link>
            </Button>
          }
        />
      </div>
    );
  }
  const booking = res.data;
  const active = ACTIVE_HOME_STATUSES.includes(booking.status);
  const [walletRes, methodsRes] = active
    ? await Promise.all([getMyWallet(), booking.status === "PENDING_PAYMENT" ? getPaymentMethods() : null])
    : [null, null];

  const via = one(sp.via);
  const method = one(sp.method);
  return (
    <HomeBookingView
      initial={booking}
      walletMinor={walletRes?.success && walletRes.data ? walletRes.data.availableMinor : 0}
      methods={methodsRes?.success && methodsRes.data ? methodsRes.data : []}
      via={via === "bkash" || via === "sslcommerz" ? via : null}
      retryMethod={method === "BKASH" || method === "SSLCOMMERZ" ? (method as ProviderId) : null}
    />
  );
}
