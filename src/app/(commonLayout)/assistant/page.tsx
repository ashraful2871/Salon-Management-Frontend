import AssistantPanel from "@/components/Assistant/AssistantPanel";
import { CHAT_RESUME_COOKIE } from "@/lib/assistant-request";
import { getCookie } from "@/services/auth/cookiesHandler";

export const metadata = {
  title: "Book with AI | SalonKhuji",
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
  const resume = (await searchParams).resume === "1";
  const resumeId = resume ? await getCookie(CHAT_RESUME_COOKIE) : null;

  return (
    <div className="min-h-screen bg-muted/30 pb-16 pt-10">
      <section className="container mx-auto mb-8 px-4 text-center">
        <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">
          Book with AI
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Tap your way from &ldquo;salons near me&rdquo; to a time that suits
          you. No forms, no typing.
        </p>
      </section>

      <section className="container mx-auto max-w-2xl px-4">
        <AssistantPanel variant="page" resume={resume} resumeId={resumeId} />
      </section>
    </div>
  );
}
