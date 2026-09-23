import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SessionKeeper from "@/components/Shared/SessionKeeper";
import AssistantProvider from "@/components/Assistant/AssistantProvider";

const CommonLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    // One chat for every public page: the provider holds it, mounts the
    // floating launcher, and lets any page open it with an action of its own.
    <AssistantProvider>
      <div className="flex flex-col min-h-screen">
        {/* Renews the token in the background so a page left open - a booking
            half filled in, say - does not expire underneath the user. */}
        <SessionKeeper />
        <Navbar />
        <main className="flex-1 pt-16">{children}</main>
        <Footer />
      </div>
    </AssistantProvider>
  );
};

export default CommonLayout;
