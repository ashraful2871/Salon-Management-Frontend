import type { Metadata } from "next";

import HomeListPage from "@/components/HomeService/HomeListPage";

export const metadata: Metadata = {
  title: "Ladies at Home: female beauty experts",
  description:
    "Facial, threading, waxing, mehedi and makeup at home by ID-verified female experts from salons near you.",
};

export default async function LadiesAtHomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  return <HomeListPage searchParams={await searchParams} audience="LADIES" />;
}
