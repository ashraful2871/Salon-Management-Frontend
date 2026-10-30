import type { Metadata } from "next";

import ExpertProfile from "@/components/HomeService/ExpertProfile";
import { getHomeExpert } from "@/services/home-service/getHomeExpert";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  // Same request as the page (no point), served from the fetch cache.
  const res = await getHomeExpert(id);
  if (!res.success || !res.data) return { title: "Home Service expert" };
  return {
    title: `${res.data.name}, ${res.data.audience === "LADIES" ? "Ladies" : "Gents"} at Home`,
    description: res.data.headline ?? `Book ${res.data.name} from ${res.data.salon.name} to your home.`,
  };
}

export default async function HomeExpertPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  return <ExpertProfile id={id} searchParams={sp} />;
}
