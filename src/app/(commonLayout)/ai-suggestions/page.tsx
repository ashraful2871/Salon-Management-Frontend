import type { Metadata } from "next";
import AiSearchInterface from "@/components/AI-Suggestions/AiSearchInterface";

export const metadata: Metadata = {
  title: "AI Match",
  description:
    "Describe what you want in your own words and get salons that match, with the reasons why.",
};

// Must match the API's limit (ai.validation.ts).
const MAX_PROMPT_LENGTH = 300;

export default async function AiSuggestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { q } = await searchParams;
  const initialQuery =
    typeof q === "string" ? q.trim().slice(0, MAX_PROMPT_LENGTH) : undefined;

  return <AiSearchInterface initialQuery={initialQuery || undefined} />;
}
