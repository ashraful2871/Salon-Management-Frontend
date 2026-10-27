import type { Metadata } from "next";

import ParlourPage from "@/components/Parlour/ParlourPage";
import { GENTS } from "@/components/Parlour/parlour-content";

// The parlour list is read per request (serverFetch reads the session cookie).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: GENTS.meta.title,
  description: GENTS.meta.description,
};

export default function GentsParlourPage() {
  return <ParlourPage content={GENTS} />;
}
