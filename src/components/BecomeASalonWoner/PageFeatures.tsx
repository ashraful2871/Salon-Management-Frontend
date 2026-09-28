import Image from "next/image";
import { CalendarClock, Search, Wallet } from "lucide-react";

import heroImg from "@/assets/hero-salon.jpg";
import { FeatureCard } from "../Shared/FeatureCard";
import { Section, SectionHeader } from "../Shared/Section";

// Only claims that are true today: approved salons show up in search, slots
// come from the salon's own schedule, and customers pay from their wallet.
const FEATURES = [
  {
    icon: Search,
    title: "Get discovered",
    description:
      "Once approved, your salon shows up in search and to customers nearby.",
  },
  {
    icon: CalendarClock,
    title: "Easy booking",
    description:
      "Customers book in seconds. You control services, staff and availability.",
  },
  {
    icon: Wallet,
    title: "Paid at booking",
    description:
      "Customers pay from their SalonKhuji wallet, and you see every booking and your earnings in the dashboard.",
  },
];

const PageFeatures = () => {
  return (
    <Section
      tone="subtle"
      labelledBy="owner-why-heading"
      containerClassName="lg:grid lg:grid-cols-2 lg:items-center lg:gap-14"
    >
      <div>
        <SectionHeader
          overline="Why SalonKhuji"
          title="Why partner with SalonKhuji?"
          titleId="owner-why-heading"
        />
        <div className="grid gap-4">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
      <Image
        src={heroImg}
        alt="Inside a salon"
        placeholder="blur"
        sizes="(min-width:1024px) 50vw, 100vw"
        className="mt-8 aspect-[4/3] w-full rounded-3xl object-cover lg:mt-0"
      />
    </Section>
  );
};

export default PageFeatures;
