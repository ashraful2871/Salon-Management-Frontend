import type { Metadata } from "next";

import HomeLanding from "@/components/HomeService/HomeLanding";

export const metadata: Metadata = {
  title: "Home Service: how it works and our policies",
  description:
    "How Home Service works: book a female beauty expert to your home from a parlour's page, the advance, cancellation and rescheduling policies, and your safety at the door.",
};

// Reads only the public settings (60 s cache), so this stays static.
export default function HomeServicePage() {
  return <HomeLanding />;
}
