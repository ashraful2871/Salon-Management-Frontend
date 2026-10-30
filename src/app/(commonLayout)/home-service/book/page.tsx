import Link from "next/link";
import { cookies } from "next/headers";
import { UserX } from "lucide-react";

import HomeBookingFlow from "@/components/HomeService/booking/HomeBookingFlow";
import { BOOK_STEP_KEYS, type BookStep } from "@/components/HomeService/booking/errors";
import { normalizePhone } from "@/components/HomeService/booking/format";
import { EmptyState } from "@/components/Shared/EmptyState";
import { Button } from "@/components/ui/button";
import { LOCATION_COOKIE, parseSavedLocation } from "@/lib/location-cookie";
import { getMe } from "@/services/auth/getMe";
import { getUserRoles } from "@/services/get-roles/getUserRoles";
import { getHomeAddresses } from "@/services/home-service/getHomeAddresses";
import { getHomeExpert } from "@/services/home-service/getHomeExpert";
import { getPaymentMethods } from "@/services/payments/getPaymentMethods";
import { getMyWallet } from "@/services/wallet/getMyWallet";

export const metadata = { title: "Book a home visit" };

type SearchParams = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const DATE = /^\d{4}-\d{2}-\d{2}$/;

function Stop({ title, description }: { title: string; description: string }) {
  return (
    <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <EmptyState
        icon={UserX}
        title={title}
        description={description}
        action={
          <Button variant="outline" asChild>
            <Link href="/home-service">Back to Home Service</Link>
          </Button>
        }
      />
    </div>
  );
}

/**
 * /home-service/book?expert=&items=a,b&any=1&date=&time=&step=: the booking
 * flow. Guests and non-customers can walk services → time; the rest needs a
 * customer account, and the URL carries the cart through sign-in.
 */
export default async function HomeBookPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const expertId = one(sp.expert);
  if (!expertId) {
    return <Stop title="Pick an expert first" description="Choose who comes to you, then pick their services." />;
  }

  const saved = parseSavedLocation((await cookies()).get(LOCATION_COOKIE)?.value);
  const point = saved ? { lat: saved.lat, lng: saved.lng, label: saved.label } : null;
  const [expertRes, role] = await Promise.all([
    getHomeExpert(expertId, point ? { lat: point.lat, lng: point.lng } : {}),
    getUserRoles(),
  ]);
  if (!expertRes.success || !expertRes.data) {
    const gone = expertRes.errorCode === "EXPERT_UNAVAILABLE" || /not found/i.test(expertRes.message);
    return (
      <Stop
        title={gone ? "This expert isn't taking home bookings right now" : "Couldn't load this expert"}
        description={gone ? "Pick another expert near you." : expertRes.message}
      />
    );
  }
  const expert = expertRes.data;

  const isCustomer = role === "CUSTOMER";
  const [addressesRes, walletRes, meRes, methodsRes] = isCustomer
    ? await Promise.all([getHomeAddresses(), getMyWallet(), getMe(), getPaymentMethods()])
    : [null, null, null, null];

  // The cart from the URL, kept to what this expert still offers.
  const menuIds = new Set(expert.menu.map((m) => m.id));
  const items = (one(sp.items) ?? "").split(",").filter((id) => menuIds.has(id)).slice(0, 10);
  const date = DATE.test(one(sp.date) ?? "") ? one(sp.date)! : null;
  const rawTime = one(sp.time);
  const time = rawTime && !Number.isNaN(Date.parse(rawTime)) ? rawTime : null;

  // The furthest step the cart supports: review always re-quotes from the address step.
  const asked = one(sp.step) as BookStep | undefined;
  const reach: BookStep = !items.length
    ? "services"
    : !date
      ? "date"
      : !time
        ? "time"
        : isCustomer
          ? "address"
          : "time";
  const order = (s: BookStep) => BOOK_STEP_KEYS.indexOf(s);
  const step: BookStep =
    asked && BOOK_STEP_KEYS.includes(asked)
      ? order(asked) > order(reach)
        ? reach
        : asked
      : items.length
        ? "expert"
        : "services";

  const me = meRes?.success ? meRes.data : undefined;
  const phone = me?.phone ? normalizePhone(me.phone) : "";

  return (
    <HomeBookingFlow
      expert={expert}
      initial={{ items, any: one(sp.any) === "1", date, time, step }}
      viewer={{
        role,
        name: me?.name ?? "",
        phone,
        walletMinor: walletRes?.success && walletRes.data ? walletRes.data.availableMinor : 0,
        addresses: addressesRes?.success && addressesRes.data ? addressesRes.data : [],
      }}
      methods={methodsRes?.success && methodsRes.data ? methodsRes.data : []}
      point={point}
    />
  );
}
