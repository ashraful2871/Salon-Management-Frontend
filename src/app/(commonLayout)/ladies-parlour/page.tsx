import type { Metadata } from "next";

import ParlourPage from "@/components/Parlour/ParlourPage";
import { LADIES } from "@/components/Parlour/parlour-content";

// The parlour list is read per request (serverFetch reads the session cookie).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: LADIES.meta.title,
  description: LADIES.meta.description,
};

export default function LadiesParlourPage() {
  return <ParlourPage content={LADIES} />;
}
