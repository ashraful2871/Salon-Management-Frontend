import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SessionKeeper from "@/components/Shared/SessionKeeper";

const CommonLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Renews the token in the background so a page left open - a booking
          half filled in, say - does not expire underneath the user. */}
      <SessionKeeper />
      <Navbar />
      <main className="flex-1 pt-16">{children}</main>
      <Footer />
    </div>
  );
};

export default CommonLayout;
