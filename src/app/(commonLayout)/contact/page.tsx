import type { Metadata } from "next";
import Contact from "@/components/Contact/Contact";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Questions about a booking, your wallet or listing your salon? Get in touch with the SalonKhuji team.",
};

export default function ContactPage() {
  return (
    <>
      <Contact />
    </>
  );
}
