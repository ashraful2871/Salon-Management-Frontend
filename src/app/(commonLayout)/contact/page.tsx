import type { Metadata } from "next";
import Contact from "@/components/Contact/Contact";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    `Questions about a booking, your wallet or listing your salon? Get in touch with the ${SITE.name} team.`,
};

export default function ContactPage() {
  return (
    <>
      <Contact />
    </>
  );
}
