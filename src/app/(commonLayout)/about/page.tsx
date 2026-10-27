import type { Metadata } from "next";
import About from "@/components/About/About";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    `Why we built ${SITE.name} and how it helps you find, compare and book salons in Bangladesh.`,
};

export default function AboutPage() {
  return (
    <>
      <About />
    </>
  );
}
