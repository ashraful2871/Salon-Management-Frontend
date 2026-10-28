import type { Metadata } from "next";

import SalonsListPage from "@/components/Salons/SalonsListPage";

export const metadata: Metadata = {
  title: "Salons near you",
  description:
    "Browse salons near you, compare services, prices and ratings, and book an open slot.",
};

export default async function SalonsStorePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  return <SalonsListPage searchParams={await searchParams} />;
}
