import type { Metadata } from "next";

import HomeListPage from "@/components/HomeService/HomeListPage";

export const metadata: Metadata = {
  title: "Gents at Home: grooming experts",
  description: "Haircut, beard and grooming at home by verified male experts from salons near you.",
};

export default async function GentsAtHomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  return <HomeListPage searchParams={await searchParams} audience="GENTS" />;
}
