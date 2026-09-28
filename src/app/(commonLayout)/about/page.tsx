import type { Metadata } from "next";
import About from "@/components/About/About";

export const metadata: Metadata = {
  title: "About",
  description:
    "Why we built SalonKhuji and how it helps you find, compare and book salons in Bangladesh.",
};

export default function AboutPage() {
  return (
    <>
      <About />
    </>
  );
}
