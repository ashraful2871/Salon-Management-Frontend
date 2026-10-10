import React, { Suspense } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SessionKeeper from "@/components/Shared/SessionKeeper";
import PageViewTracker from "@/components/Shared/PageViewTracker";
import { AnnouncementBar } from "@/components/Shared/AnnouncementBar";
import { ImpersonationBanner } from "@/components/Shared/ImpersonationBanner";
import AssistantProvider from "@/components/Assistant/AssistantProvider";
import { getAssistantAccess } from "@/services/assistant/getAssistantAccess";

const CommonLayout = async ({ children }: { children: React.ReactNode }) => {
  // The API's kill switch and the rollout allowlist, decided once per request.
  const access = await getAssistantAccess();

  return (
    // One chat for every public page: the provider holds it, mounts the
    // floating launcher, and lets any page open it with an action of its own.
    <AssistantProvider access={access}>
      <div className="flex flex-col min-h-screen">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[70] focus:rounded-full focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:shadow-card"
        >
          Skip to content
        </a>
        {/* Renews the token in the background so a page left open - a booking
            half filled in, say - does not expire underneath the user. */}
        <SessionKeeper />
        {/* Cookieless, aggregated page counts (lib/track.ts). */}
        <PageViewTracker />
        {/* Read-only "View as" bar; the navbar and main move down under it. */}
        <Suspense fallback={null}>
          <ImpersonationBanner />
        </Suspense>
        <Navbar />
        <main id="main" tabIndex={-1} className="flex-1 pt-[calc(4rem+var(--imp-offset,0px))] outline-none">
          {/* The navbar is fixed, so the announcement sits directly under it,
              at the top of the page flow. */}
          <AnnouncementBar />
          {children}
        </main>
        <Footer />
      </div>
    </AssistantProvider>
  );
};

export default CommonLayout;
