import type { Metadata } from "next";

import HomeLanding from "@/components/HomeService/HomeLanding";

export const metadata: Metadata = {
  title: "Home Service: beauty experts at your home",
  description:
    "Book verified beauty experts to your home. Ladies at Home sends female experts only. Pay half now, half at home.",
};

// Reads only the public settings (60 s cache), so this stays static.
export default function HomeServicePage() {
  return <HomeLanding />;
}
