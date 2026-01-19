import PageHero from "@/components/BecomeASalonWoner/PageHero";
import PageStats from "@/components/BecomeASalonWoner/PageStats";
import PageFeatures from "@/components/BecomeASalonWoner/PageFeatures";
import ApplyForm from "@/components/BecomeASalonWoner/ApplyForm";

export default function BecomeSalonOwnerPage() {
  return (
    <>
      {/* HERO (same style as Contact/About: bg-muted/50 + badge primary/10) */}

      <PageHero />
      {/* STATS (same style as About stats section) */}
      <PageStats />

      {/* FEATURE + IMAGE (like About story section bg-card) */}
      <PageFeatures />
      {/* APPLY FORM (same style as Contact form area) */}

      <ApplyForm />
    </>
  );
}
