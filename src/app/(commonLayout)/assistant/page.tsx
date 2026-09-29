import { notFound } from "next/navigation";

import AssistantPanel from "@/components/Assistant/AssistantPanel";
import { PublicPageHero } from "@/components/Shared/PublicPageHero";
import { CHAT_RESUME_COOKIE } from "@/lib/assistant-request";
import { getAssistantAccess } from "@/services/assistant/getAssistantAccess";
import { getCookie } from "@/services/auth/cookiesHandler";

export const metadata = {
  title: "Book with AI",
  description:
    "Find a salon near you and book a time without typing a word - tap your way from location to confirmed appointment.",
};

// The same chat as the floating panel, filling a page: a link worth sharing,
// and the way out of a cramped in-app browser on a phone. `?resume=1` is the
// way back from the wallet's payment result page: the chat reopens on the
// conversation that started the top-up and asks how it went.
export default async function AssistantPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Kill switch off, or not on the rollout allowlist: the page is not there,
  // the same answer the API gives.
  if (!(await getAssistantAccess()).enabled) notFound();

  const resume = (await searchParams).resume === "1";
  const resumeId = resume ? await getCookie(CHAT_RESUME_COOKIE) : null;

  return (
    <>
      <PublicPageHero
        size="compact"
        overline="AI booking assistant"
        title="Book with AI"
        description={
          <>
            Tap your way from &ldquo;salons near me&rdquo; to a time that suits
            you &mdash; or just type it: &ldquo;haircut in Dhanmondi tomorrow
            evening&rdquo;, in English, বাংলা or Banglish.
          </>
        }
      />

      <section className="container mx-auto max-w-2xl px-4 pb-16 pt-6 md:pt-8">
        <AssistantPanel variant="page" resume={resume} resumeId={resumeId} />
      </section>
    </>
  );
}
