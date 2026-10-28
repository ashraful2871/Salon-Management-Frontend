import type { Metadata } from "next";

import LadiesParlourPage from "@/components/LadiesParlour/LadiesParlourPage";

// The parlours are read per request (serverFetch reads the session cookie).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ladies parlours near you",
  description:
    "Book trusted ladies parlours for haircuts, facials, keratin, threading and bridal makeup. See prices, real reviews and open times.",
};

export default function LadiesParlourRoute() {
  return <LadiesParlourPage />;
}
